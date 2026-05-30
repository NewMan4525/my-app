// ./src/utils/hooks/useChromiumWorker.ts
'use client';

import { useState, useRef, useEffect } from 'react';
import { IWarItem } from '@/src/types/interfaces';

interface IWorkerProps {
    cachedLogTextRef: React.RefObject<string | null>;
    setWarItems: React.Dispatch<React.SetStateAction<IWarItem[]>>;
    clearRowsVisualOpacity: () => void;
    setUpdateNonce: React.Dispatch<React.SetStateAction<string>>;
}

export function useChromiumWorker({
    cachedLogTextRef,
    setWarItems,
    clearRowsVisualOpacity,
    setUpdateNonce,
}: IWorkerProps) {
    const [isAutoChecking, setIsAutoChecking] = useState<boolean>(false);
    const radarWorkerRef = useRef<Worker | null>(null);

    const toggleAutoChecker = (): void => {
        if (isAutoChecking) {
            if (radarWorkerRef.current) {
                radarWorkerRef.current.terminate();
                radarWorkerRef.current = null;
            }
            setIsAutoChecking(false);
        } else {
            const savedText = cachedLogTextRef.current;
            if (!savedText) return;
            setIsAutoChecking(true);

            const radarCode = `
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        setInterval(() => {
                            self.postMessage('tick');
                        }, 305000);
                    }
                };
            `;

            const blob = new Blob([radarCode], {
                type: 'application/javascript',
            });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);
            radarWorkerRef.current = worker;

            worker.postMessage('start');
            worker.onmessage = async (e: MessageEvent) => {
                if (e.data === 'tick' && cachedLogTextRef.current) {
                    try {
                        const response = await fetch('/api/war', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                logText: cachedLogTextRef.current,
                            }),
                        });

                        if (response.ok) {
                            const result = await response.json();

                            clearRowsVisualOpacity();
                            setUpdateNonce(Date.now().toString());
                            if (result && Array.isArray(result.data)) {
                                setWarItems(result.data);
                            }
                        }
                    } catch (err) {
                        console.error(
                            'Background auto radar network crash:',
                            err,
                        );
                    }
                }
            };
            URL.revokeObjectURL(url);
        }
    };

    useEffect(() => {
        return () => {
            if (radarWorkerRef.current) {
                radarWorkerRef.current.terminate();
            }
        };
    }, []);

    return {
        isAutoChecking,
        toggleAutoChecker,
    };
}
