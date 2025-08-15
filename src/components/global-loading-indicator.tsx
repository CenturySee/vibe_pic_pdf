"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);

  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    let isMounted = true;

    const handleRouteChangeStart = () => {
      // 清除之前的定时器
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      
      // 设置一个小的延迟，避免快速切换时的闪烁
      loadingTimer = setTimeout(() => {
        if (isMounted) {
          setIsLoading(true);
        }
      }, 150);
    };

    const handleRouteChangeComplete = () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      
      // 增加key强制重新渲染
      if (isMounted) {
        setLoadingKey(prev => prev + 1);
        setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, 100);
      }
    };

    // 监听所有链接的点击事件
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.target && link.href.startsWith(window.location.origin)) {
        handleRouteChangeStart();
      }
    };

    // 监听浏览器前进/后退
    const handlePopState = () => {
      handleRouteChangeStart();
      setTimeout(handleRouteChangeComplete, 300);
    };

    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 监听 pathname 的变化作为主要触发方式
  useEffect(() => {
    handleRouteChangeStart();
    
    const timer = setTimeout(() => {
      handleRouteChangeComplete();
    }, 300);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [pathname]);

  const handleRouteChangeStart = () => {
    setIsLoading(true);
  };

  const handleRouteChangeComplete = () => {
    setLoadingKey(prev => prev + 1);
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  if (!isLoading) return null;

  return (
    <div key={loadingKey} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 bg-white rounded-lg p-6 shadow-xl border">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        <span className="text-lg font-medium text-gray-700">拼命加载中...</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}