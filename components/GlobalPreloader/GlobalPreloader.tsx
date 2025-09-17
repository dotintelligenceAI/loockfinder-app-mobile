import { usePreloader } from '@/contexts/PreloaderContext';
import React from 'react';
import { Preloader } from '../Preloader';

export default function GlobalPreloader() {
  const { preloader } = usePreloader();

  return (
    <Preloader
      visible={preloader.visible}
      message={preloader.message}
    />
  );
} 