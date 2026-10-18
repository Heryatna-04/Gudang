'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseScaleSerialOptions {
  baudRate?: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  onWeightChange?: (weight: number) => void;
  mockMode?: boolean; // Mock mode toggle for dev/testing before physical RS-232 cable arrives
}

export interface ScaleStatus {
  isConnected: boolean;
  isStreaming: boolean;
  currentWeight: number;
  portInfo: string | null;
  error: string | null;
  isMock: boolean;
}

export function useScaleSerial(options: UseScaleSerialOptions = {}) {
  const {
    baudRate = 9600,
    dataBits = 8,
    stopBits = 1,
    parity = 'none',
    bufferSize = 255,
    onWeightChange,
    mockMode = true, // Default to true while waiting for hardware
  } = options;

  const [status, setStatus] = useState<ScaleStatus>({
    isConnected: mockMode,
    isStreaming: mockMode,
    currentWeight: 0,
    portInfo: mockMode ? 'Virtual Alexa BFS (Mock Mode)' : null,
    error: null,
    isMock: mockMode,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);

  // Parse weight string from Alexa BFS format (e.g., 'ST,GS,+00125.50kg\r\n' or 'WN0125.50kg')
  const parseAlexaBFSStream = useCallback((raw: string): number | null => {
    // Regex matches common continuous ASCII indicators for weight scales
    const match = raw.match(/([+-]?\d+(?:\.\d+)?)\s*(?:kg|g)?/i);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      return isNaN(val) ? null : Math.max(0, val);
    }
    return null;
  }, []);

  // Connect to Physical Serial Port (Web Serial API)
  const connectHardware = useCallback(async () => {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      setStatus((prev) => ({
        ...prev,
        error: 'Web Serial API tidak didukung di browser ini. Gunakan Chrome atau Edge.',
      }));
      return;
    }

    try {
      // Prompt user to select COM / USB Serial Port
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const port = await (navigator as any).serial.requestPort();
      await port.open({
        baudRate,
        dataBits,
        stopBits,
        parity,
        bufferSize,
      });

      portRef.current = port;
      keepReadingRef.current = true;

      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        isStreaming: true,
        error: null,
        portInfo: 'Alexa BFS Connected (RS-232)',
        isMock: false,
      }));

      // Deteksi kabel dicabut saat streaming
      if (typeof port.addEventListener === 'function') {
        port.addEventListener('disconnect', () => {
          keepReadingRef.current = false;
          setStatus((prev) => ({
            ...prev,
            isConnected: false,
            isStreaming: false,
            portInfo: null,
            error: 'Kabel timbangan terputus.',
          }));
        });
      }

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let lineBuffer = '';

      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          lineBuffer += value;
          const lines = lineBuffer.split(/\r?\n/);
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const parsed = parseAlexaBFSStream(line);
            if (parsed !== null) {
              setStatus((prev) => ({ ...prev, currentWeight: parsed }));
              onWeightChange?.(parsed);
            }
          }
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal membuka port serial';
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isStreaming: false,
        portInfo: null,
        error: errorMsg,
      }));
    }
  }, [baudRate, dataBits, stopBits, parity, bufferSize, parseAlexaBFSStream, onWeightChange]);

  // Disconnect Hardware
  const disconnectHardware = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      console.error('Error closing port:', err);
    } finally {
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        isStreaming: false,
        portInfo: null,
      }));
    }
  }, []);

  // Input berat manual (mode tanpa kabel). Tidak mengubah isConnected/isMock.
  const setSimulatedWeight = useCallback(
    (weight: number) => {
      const validWeight = Math.max(0, Number(weight) || 0);
      setStatus((prev) => ({ ...prev, currentWeight: validWeight }));
      onWeightChange?.(validWeight);
    },
    [onWeightChange]
  );

  const resetTare = useCallback(() => {
    setSimulatedWeight(0);
  }, [setSimulatedWeight]);

  useEffect(() => {
    return () => {
      if (keepReadingRef.current) {
        disconnectHardware();
      }
    };
  }, [disconnectHardware]);

  return {
    ...status,
    connectHardware,
    disconnectHardware,
    setSimulatedWeight,
    resetTare,
  };
}
