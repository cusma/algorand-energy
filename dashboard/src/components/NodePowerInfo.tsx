import { Info } from 'lucide-react';

export const NodePowerInfo = () => {
  return (
    <div className="bg-card border-border shadow-card rounded-lg border p-5">
      <div className="flex items-start gap-3">
        <Info className="text-primary mt-0.5 shrink-0" size={24} />
        <div className="text-sm">
          <p className="text-foreground">
            <span className="font-semibold">Average Node Power Consumption:</span>{' '}
            <span className="text-primary font-mono font-bold">40 W</span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Source:{' '}
            <a
              href="https://26119259.fs1.hubspotusercontent-eu1.net/hubfs/26119259/Website-2024/PDFs/Proof%20of%20Stake%20Blockchain%20Efficiency%20Framework.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline transition-colors"
            >
              Proof of Stake Blockchain Efficiency Framework (PDF)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
