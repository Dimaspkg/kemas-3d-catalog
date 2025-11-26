
'use client';

import Image from 'next/image';
import { Logo } from './icons/logo';

interface HeaderLogoProps {
    logoUrl: string | null;
}

export function HeaderLogo({ logoUrl }: HeaderLogoProps) {
    if (logoUrl) {
        return <Image src={logoUrl} alt="KEMAS Innovations Logo" width={100} height={28} className="object-contain h-10" priority />;
    }
    
    return <Logo className="h-10 w-auto text-primary" />;
}
