import Image from "next/image";
import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white">
            <div className="wrapper h-20 flex items-center justify-center sm:justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-12 h-12 overflow-hidden rounded-lg p-1">
                        <Image
                            src="/tvs-logo.png"
                            alt="The Venkateshwar School Logo"
                            width={48}
                            height={48}
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-xl leading-tight tracking-tight uppercase text-gray-900">The Venkateshwar School</span>
                        <span className="text-[10px] text-gray-500 tracking-widest uppercase">Excellence in Education</span>
                    </div>
                </Link>
            </div>
        </header>
    );
}
