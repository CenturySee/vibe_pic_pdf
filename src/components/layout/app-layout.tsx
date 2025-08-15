"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { FileImage, FileText } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dismiss } = useToast();
  const dismissRef = useRef(dismiss);

  // Update ref when dismiss function changes
  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  // Dismiss all toasts when route changes
  useEffect(() => {
    dismissRef.current();
  }, [pathname]);

  // Preload the other route when hovering over navigation items
  const handleNavHover = (href: string) => {
    if (href !== pathname) {
      router.prefetch(href);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2.5">
            <AppLogo className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">PicTools</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Images to PDF"
                onMouseEnter={() => handleNavHover('/')}
              >
                <Link href="/">
                  <FileImage />
                  <span>Images to PDF</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/pdf-to-images'}
                tooltip="PDF to Images"
                onMouseEnter={() => handleNavHover('/pdf-to-images')}
              >
                <Link href="/pdf-to-images">
                  <FileText />
                  <span>PDF to Images</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
