import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-emerald-600 mb-4">
          Dream Nest Aviary & Farm
        </h1>
        <p className="text-gray-600 mb-8">
          Professional farm management system for pigeons and chickens
        </p>
        <div className="space-x-4">
          <Link 
            href="/login"
            className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 transition inline-block"
          >
            Login
          </Link>
          <Link 
            href="/explore"
            className="border border-emerald-600 text-emerald-600 px-6 py-2 rounded-md hover:bg-emerald-50 transition inline-block"
          >
            Explore Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}