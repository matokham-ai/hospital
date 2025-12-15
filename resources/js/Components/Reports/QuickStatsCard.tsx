import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickStatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
    description?: string;
}

export function QuickStatsCard({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    description 
}: QuickStatsCardProps) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        red: 'text-red-600 bg-red-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50'
    };

    const changeColor = change && change >= 0 ? 'text-green-600' : 'text-red-600';
    const changeIcon = change && change >= 0 ? '↗' : '↘';

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {typeof value === 'number' ? value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
                </div>
                
                {change !== undefined && (
                    <div className={`text-xs ${changeColor} flex items-center gap-1`}>
                        <span>{changeIcon}</span>
                        <span>{Math.abs(change)}% from last period</span>
                    </div>
                )}
                
                {description && (
                    <p className="text-xs text-gray-500 mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}