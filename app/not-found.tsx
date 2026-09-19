import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            NOVA/MARKET
          </h1>
          <p className="text-xl text-gray-600">
            Page not found
          </p>
        </div>

        <div className="space-y-4 text-left bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            We couldn&apos;t find that page
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• The link may be outdated or the page may have moved.</li>
            <li>• Browse the technology collection to find what you need.</li>
          </ul>
        </div>

        <div className="pt-4">
          <p className="text-gray-600 mb-4">
            Return to NOVA/MARKET and continue exploring the collection.
          </p>
          <Link href="/">
            <Button size="lg" className="w-full md:w-auto">
              Return to Home Page
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Built with Next.js · TypeScript · Prisma · PostgreSQL
          </p>
        </div>
      </Card>
    </div>
  );
}
