type MarkProps = {
  className?: string;
};

function OrangeMoneyMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#FF7900" />
      <circle cx="32" cy="32" r="13" fill="#fff" />
      <circle cx="32" cy="32" r="7" fill="#FF7900" />
    </svg>
  );
}

function MtnMomoMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#FFCC00" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="15"
        fontWeight="800"
        fontFamily="Manrope, Segoe UI, sans-serif"
      >
        MTN
      </text>
    </svg>
  );
}

function WhatsappMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#128C7E" />
      <path
        fill="#fff"
        d="M32.1 16.8c-8.4 0-15.2 6.8-15.2 15.2 0 2.7.7 5.2 2 7.4L17 47.2l8-2.1c2.1 1.1 4.5 1.8 7.1 1.8 8.4 0 15.2-6.8 15.2-15.2S40.5 16.8 32.1 16.8zm8.8 21.5c-.4 1-2.1 1.9-2.9 2-.8.1-1.7.2-2.8-.2-1.1-.3-2.4-.8-4.1-1.7-2.2-1.2-3.6-2.6-4-2.9-.4-.4-1.5-1.6-1.5-3.1s1-3.5 1.3-3.8c.4-.4.8-.5 1.1-.5h.8c.3 0 .6 0 .9.7.4.8 1.2 2.8 1.3 3 .1.2.2.4 0 .7-.1.3-.2.5-.4.7l-.6.7c-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 .1.9.2.4-.1.8-.4.3-.3.7-.4 1.1-.2.4.1 1.8.8 2.1 1 .3.2.5.3.6.5.1.3 0 .8-.3 1.8z"
      />
    </svg>
  );
}

function MoovMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#E30613" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="800"
        fontFamily="Manrope, Segoe UI, sans-serif"
      >
        Moov
      </text>
    </svg>
  );
}

function VisaMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1A1F71" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="800"
        fontFamily="Manrope, Segoe UI, sans-serif"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#F8F6F0" />
      <circle cx="26" cy="32" r="12" fill="#EB001B" />
      <circle cx="38" cy="32" r="12" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M32 22.8a12 12 0 0 1 0 18.4 12 12 0 0 1 0-18.4z"
      />
    </svg>
  );
}

function GenericPayMark({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#174b37" />
      <rect x="14" y="22" width="36" height="22" rx="5" fill="#f8f6f0" />
      <rect x="14" y="26" width="36" height="6" fill="#d8aa34" />
    </svg>
  );
}

export function PaymentMethodMark({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const key = code.toLowerCase();
  if (key.includes("whatsapp") || key.includes("agent")) {
    return <WhatsappMark className={className} />;
  }
  if (key.includes("orange")) return <OrangeMoneyMark className={className} />;
  if (key.includes("mtn") || (key.includes("momo") && !key.includes("moov"))) {
    return <MtnMomoMark className={className} />;
  }
  if (key.includes("moov")) return <MoovMark className={className} />;
  if (key.includes("visa")) return <VisaMark className={className} />;
  if (key.includes("master")) return <MastercardMark className={className} />;
  return <GenericPayMark className={className} />;
}
