import Image from "next/image";

type CamboGarageLogoProps = {
    className?: string;
    eager?: boolean;
    sizes?: string;
};

export function CamboGarageLogo({
    className = "h-16 w-auto",
    eager = false,
    sizes = "(max-width: 639px) 7rem, 9rem",
}: CamboGarageLogoProps) {
    return (
        <Image
            src="/logo.png"
            alt="Cambo Garage"
            width={1672}
            height={941}
            className={className}
            loading={eager ? "eager" : "lazy"}
            sizes={sizes}
        />
    );
}
