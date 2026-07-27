import { PrimesTabs } from "./primes-tabs";

export default function PrimesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-6">
      <PrimesTabs />
      {children}
    </div>
  );
}
