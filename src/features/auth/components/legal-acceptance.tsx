import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LegalAcceptanceProps {
    acceptedTerms: boolean;
    acceptedDPA: boolean;
    onAcceptedTermsChange: (checked: boolean) => void;
    onAcceptedDPAChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const LegalAcceptance = ({
    acceptedTerms,
    acceptedDPA,
    onAcceptedTermsChange,
    onAcceptedDPAChange,
    disabled,
}: LegalAcceptanceProps) => {
    return (
        <div className="space-y-4 py-2">
            <div className="flex items-start space-x-3">
                <Checkbox
                    id="acceptedTerms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => onAcceptedTermsChange(!!checked)}
                    disabled={disabled}
                    className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="acceptedTerms"
                        className="text-sm font-medium leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        I accept the{" "}
                        <Link
                            href="https://fairlx.com/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Terms of Service
                        </Link>
                    </Label>
                </div>
            </div>

            <div className="flex items-start space-x-3">
                <Checkbox
                    id="acceptedDPA"
                    checked={acceptedDPA}
                    onCheckedChange={(checked) => onAcceptedDPAChange(!!checked)}
                    disabled={disabled}
                    className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="acceptedDPA"
                        className="text-sm font-medium leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        I accept the{" "}
                        <Link
                            href="https://fairlx.com/dpa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Data Processing Agreement (DPA)
                        </Link>
                    </Label>
                </div>
            </div>
        </div>
    );
};
