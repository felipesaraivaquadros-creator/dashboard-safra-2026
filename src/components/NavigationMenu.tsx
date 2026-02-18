"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Wallet, Truck, ChevronRight, ArrowLeft, FileText } from 'lucide-react';

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const safraId = params.safraId as string;

  // Fecha o menu ao clicar fora ou mudar de rota
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      setIsOpen(false);
    };
  }, [pathname]);

  const menuItems = [
    { 
      label: 'Painel', 
      href: `/${safraId}`, 
      icon: LayoutDashboard,
      active: pathname === `/${safraId}`
    },
    { 
      label: 'Saldos', 
      href: `/${safraId}/saldos`, 
      icon: Wallet,
      active: pathname.includes('/saldos')
    },
    { 
      label: 'Fretes', 
      href: `/${safraId}/fretes`, 
      icon: Truck,
      active: pathname.includes('/fretes')
    },
    { 
      label: 'Recibos', 
      href: `/${safraId}/recibos`, 
      icon: FileText,
      active: pathname.includes('/recibos')
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center"
        aria-label="Menu de navegação"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[250] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            <p className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Navegação</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between p-3 rounded-xl transition-all group
                    ${item.active 
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={item.active ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} />
                    <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                  </div>
                  {item.active && <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                  {!item.active && <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>
              );
            })}
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
            <Link 
              href="/"
              className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-red-500 transition-all"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-black uppercase">Sair da Safra</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}