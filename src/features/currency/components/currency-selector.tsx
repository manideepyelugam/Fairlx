"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useGetCurrencyRates } from "../api/use-currency";

// Currency info with symbols
const CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
];

// Local storage key
const STORAGE_KEY = "fairlx_display_currency";

/**
 * Currency Selector Hook
 * 
 * Manages the selected display currency with localStorage persistence.
 */
export function useDisplayCurrency() {
    const [currency, setCurrencyState] = useState("USD");
    const { data: ratesData } = useGetCurrencyRates();

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && CURRENCIES.find(c => c.code === stored)) {
            setCurrencyState(stored);
        }
    }, []);

    // Save to localStorage when changed
    const setCurrency = (code: string) => {
        setCurrencyState(code);
        localStorage.setItem(STORAGE_KEY, code);
    };

    // Get rate for current currency (relative to USD)
    const rate = ratesData?.rates?.[currency] || 1;
    const currencyInfo = CURRENCIES.find(c => c.code === currency);

    // Convert USD amount to display currency
    const convertFromUsd = (usdAmount: number): number => {
        return Math.round(usdAmount * rate * 100) / 100;
    };

    // Format amount in display currency
    const formatAmount = (usdAmount: number): string => {
        const converted = convertFromUsd(usdAmount);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(converted);
    };

    return {
        currency,
        setCurrency,
        rate,
        currencyInfo,
        convertFromUsd,
        formatAmount,
        rates: ratesData?.rates || {},
        isLive: ratesData?.isLive || false,
    };
}

interface CurrencySelectorProps {
    value: string;
    onChange: (code: string) => void;
    rates?: Record<string, number>;
    showRates?: boolean;
    className?: string;
}

/**
 * Currency Selector Dropdown
 * 
 * Shows a dropdown with all supported currencies and their live rates.
 */
export function CurrencySelector({
    value,
    onChange,
    rates = {},
    showRates = true,
    className,
}: CurrencySelectorProps) {
    const selected = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 ${className || ""}`}
                >
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{selected.flag} {selected.code}</span>
                    {showRates && rates[value] && value !== "USD" && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                            1 USD = {rates[value]?.toFixed(2)}
                        </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                {CURRENCIES.map((currency) => (
                    <DropdownMenuItem
                        key={currency.code}
                        onClick={() => onChange(currency.code)}
                        className={`flex items-center justify-between ${value === currency.code ? "bg-accent" : ""
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span className="font-medium">{currency.code}</span>
                            <span className="text-muted-foreground text-sm">
                                {currency.name}
                            </span>
                        </div>
                        {showRates && rates[currency.code] && currency.code !== "USD" && (
                            <span className="text-xs text-muted-foreground">
                                {rates[currency.code]?.toFixed(2)}
                            </span>
                        )}
                        {currency.code === "USD" && (
                            <span className="text-xs text-muted-foreground">Base</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Compact Currency Badge
 * 
 * Shows selected currency with rate in a compact format.
 */
export function CurrencyBadge({
    currency,
    rate,
    isLive,
}: {
    currency: string;
    rate: number;
    isLive: boolean;
}) {
    const info = CURRENCIES.find(c => c.code === currency);

    return (
        <div className="flex items-center gap-2 text-sm">
            <Badge variant={isLive ? "default" : "secondary"}>
                {info?.flag} {currency}
            </Badge>
            {currency !== "USD" && (
                <span className="text-muted-foreground">
                    1 USD = {info?.symbol}{rate?.toFixed(2)}
                </span>
            )}
        </div>
    );
}
