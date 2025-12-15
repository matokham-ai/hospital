import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
    const [query, setQuery] = useState('');

    return (
        <HMSLayout>
            <Head title="Universal Search" />
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Universal Search</h1>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by patient name, MRN, phone number..."
                            className="flex-1 border border-gray-300 rounded-lg p-3"
                        />
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <SearchIcon className="h-5 w-5" />
                            Search
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Enter search criteria to find patients</p>
                </div>
            </div>
        </HMSLayout>
    );
}
