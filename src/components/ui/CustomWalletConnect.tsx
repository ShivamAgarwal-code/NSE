'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import "@/app/globals.css";
import { ChevronDown, Wallet } from "lucide-react";
import Image from 'next/image';
import { AssociateTokensModal } from "./AssociateTokensModal";

export const CustomWalletConnect = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button 
                    onClick={openConnectModal} 
                    type="button"
                    className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors rounded-md text-white flex items-center gap-2 py-2 px-4 text-sm font-medium"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button" 
                    className="bg-[var(--danger)]  text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <span>Wrong Network</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                );
              }
              return (
                <div className="flex gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 bg-[var(--card-bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 transition-colors px-3 py-1.5 rounded-md text-sm"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                        className="flex items-center justify-center"
                      >
                        {chain.iconUrl && (
                          <Image
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            width={16}
                            height={16}
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>
                  
                  <button 
                    onClick={openAccountModal} 
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    <span className="truncate max-w-32">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <>
                        <span className="hidden sm:inline mx-1 opacity-50">|</span>
                        <span className="hidden sm:block opacity-80 font-normal">{account.displayBalance}</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  <AssociateTokensModal />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};