import React from 'react';
import { Preloader } from '@/components';
import { usePreloader } from '@/contexts/PreloaderContext';

export default function GlobalPreloader() {
  const { preloader } = usePreloader();

  return (
    <Preloader
      visible={preloader.visible}
      message={preloader.message}
    />
  );
} 