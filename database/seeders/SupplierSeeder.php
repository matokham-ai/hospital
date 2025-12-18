<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'MedSupply Corp',
                'contact_person' => 'John Smith',
                'phone' => '+1-555-0123',
                'email' => 'orders@medsupply.com',
                'address' => '123 Medical District, Healthcare City, HC 12345',
                'is_active' => true,
            ],
            [
                'name' => 'PharmaCare Distributors',
                'contact_person' => 'Sarah Johnson',
                'phone' => '+1-555-0456',
                'email' => 'sales@pharmacare.com',
                'address' => '456 Pharma Avenue, Medicine Town, MT 67890',
                'is_active' => true,
            ],
            [
                'name' => 'Global Health Solutions',
                'contact_person' => 'Michael Chen',
                'phone' => '+1-555-0789',
                'email' => 'contact@globalhealthsol.com',
                'address' => '789 Health Plaza, Wellness City, WC 54321',
                'is_active' => true,
            ],
            [
                'name' => 'Regional Medical Supply',
                'contact_person' => 'Emily Davis',
                'phone' => '+1-555-0321',
                'email' => 'info@regionalmedsupply.com',
                'address' => '321 Supply Chain Blvd, Distribution Hub, DH 98765',
                'is_active' => true,
            ],
            [
                'name' => 'BioMed Enterprises',
                'contact_person' => 'Robert Wilson',
                'phone' => '+1-555-0654',
                'email' => 'orders@biomedent.com',
                'address' => '654 Innovation Drive, BioTech Park, BP 13579',
                'is_active' => true,
            ]
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}