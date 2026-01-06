"use client";

import { useState } from "react";
import { RefreshCw, DollarSign, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useGetCurrencyRates, useConvertCurrency, useGetUsdToInrRate } from "../api/use-currency";

const POPULAR_CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

/**
 * Currency Exchange Rate Panel
 * 
 * Admin panel component for viewing live exchange rates
 * and converting between currencies.
 */
export function CurrencyRatePanel() {
    const [amount, setAmount] = useState("100");
    const [fromCurrency, setFromCurrency] = useState("USD");
    const [toCurrency, setToCurrency] = useState("INR");

    const { data: ratesData, isLoading: isLoadingRates, refetch: refetchRates } = useGetCurrencyRates();
    const { data: usdInrData, isLoading: isLoadingUsdInr } = useGetUsdToInrRate();
    const { data: conversionData, isPending: isConverting, mutate: convert } = useConvertCurrency();

    const handleConvert = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        convert({ amount: numAmount, from: fromCurrency, to: toCurrency });
    };

    const handleSwapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    return (
        <div className="space-y-6">
            {/* USD to INR Card - Primary for billing */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                USD → INR Rate
                            </CardTitle>
                            <CardDescription>
                                Primary billing conversion rate
                            </CardDescription>
                        </div>
                        <Badge variant={ratesData?.isLive ? "default" : "secondary"}>
                            {ratesData?.isLive ? "Live" : "Cached"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingUsdInr ? (
                        <Skeleton className="h-16 w-full" />
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-4xl font-bold text-primary">
                                    ₹{usdInrData?.rate?.toFixed(2) || "N/A"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    1 USD = {usdInrData?.rate?.toFixed(2)} INR
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-semibold">
                                    {usdInrData?.sample?.formatted?.usd}
                                </p>
                                <p className="text-lg text-muted-foreground">
                                    = {usdInrData?.sample?.formatted?.inr}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Currency Converter */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Currency Converter
                    </CardTitle>
                    <CardDescription>
                        Convert between any supported currencies
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="100"
                                min="0"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Label>From</Label>
                            <Select value={fromCurrency} onValueChange={setFromCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POPULAR_CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.symbol} {c.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleSwapCurrencies}
                                className="mt-6"
                            >
                                ⇄
                            </Button>
                        </div>
                        <div className="md:col-span-1">
                            <Label>To</Label>
                            <Select value={toCurrency} onValueChange={setToCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POPULAR_CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.symbol} {c.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-1">
                            <Button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="w-full"
                            >
                                {isConverting ? "Converting..." : "Convert"}
                            </Button>
                        </div>
                    </div>

                    {conversionData && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-center text-2xl font-bold">
                                {conversionData.formatted}
                            </p>
                            <p className="text-center text-sm text-muted-foreground mt-1">
                                {amount} {fromCurrency} = {conversionData.convertedAmount?.toFixed(2)} {toCurrency}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All Rates Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Exchange Rates</CardTitle>
                            <CardDescription>
                                Rates based on USD (updated {ratesData?.fetchedAt ? new Date(ratesData.fetchedAt).toLocaleTimeString() : "N/A"})
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchRates()}
                            disabled={isLoadingRates}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRates ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingRates ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {ratesData?.rates && Object.entries(ratesData.rates).map(([code, rate]) => {
                                const currency = POPULAR_CURRENCIES.find(c => c.code === code);
                                return (
                                    <div key={code} className="p-3 bg-muted rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{code}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {currency?.symbol || ""}
                                            </span>
                                        </div>
                                        <p className="text-lg font-semibold mt-1">
                                            {typeof rate === 'number' ? rate.toFixed(4) : rate}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
