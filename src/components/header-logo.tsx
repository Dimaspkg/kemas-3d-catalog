
'use client';

import Image from 'next/image';
import { Logo } from './icons/logo';
import { cn } from '@/lib/utils';

interface HeaderLogoProps {
    logoUrl: string | null;
    className?: string;
}

export function HeaderLogo({ logoUrl, className }: HeaderLogoProps) {
    if (logoUrl) {
        return <Image src={logoUrl} alt="KEMAS Innovations Logo" width={100} height={28} className={cn("object-contain h-10", className)} priority />;
    }
    
    return <Logo className={cn("h-10 w-auto text-primary", className)} />;
}
