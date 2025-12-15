import React, { useState, useEffect, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Switch } from "@/Components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { useToast } from "@/Components/ui/use-toast";
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  CreditCard, 
  Server,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Search,
  RotateCcw
} from "lucide-react";

interface Setting {
  key: string;
  value: string;
  group: string;
}

interface Category {
  title: string;
  description: string;
  icon: string;
}

interface Props {
  settings: Record<string, Setting[]>;
  categories: Record<string, Category>;
}

const iconMap = {
  Settings,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Server
};

export default function SystemSettings({ settings, categories }: Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize form data
  useEffect(() => {
    const initialForm = Object.fromEntries(
      Object.values(settings).flat().map(s => [s.key, s.value || ""])
    );
    setForm(initialForm);
  }, [settings]);

  const handleInputChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    router.post(route("admin.settings.update"), form, {
      onSuccess: () => {
        toast({ 
          title: "Settings saved successfully", 
          description: "Your system settings have been updated.",
        });
        setHasChanges(false);
      },
      onError: (errors) => {
        toast({ 
          title: "Failed to save settings", 
          description: "Please check your inputs and try again.",
          variant: "destructive"
        });
      },
      onFinish: () => setIsLoading(false)
    });
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      router.post(route("admin.settings.update"), {
        // Reset to default values
        hospital_name: 'MediCare Hospital',
        primary_color: '#0ea5e9',
        currency_symbol: '$',
        // Add other defaults as needed
      }, {
        onSuccess: () => {
          toast({ 
            title: "Settings reset", 
            description: "All settings have been reset to default values.",
          });
          setHasChanges(false);
        }
      });
    }
  };

  // Filter settings based on search query
  const filteredSettings = useMemo(() => {
    if (!searchQuery) return settings;
    
    const filtered: Record<string, Setting[]> = {};
    Object.entries(settings).forEach(([group, groupSettings]) => {
      const matchingSettings = groupSettings.filter(setting => {
        const keyMatch = setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        setting.key.split('_').join(' ').toLowerCase().includes(searchQuery.toLowerCase());
        
        // Also search in select option labels for better UX
        const selectOptions = getSelectOptions(setting.key);
        const optionMatch = selectOptions.some(option => 
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.value.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        return keyMatch || optionMatch;
      });
      if (matchingSettings.length > 0) {
        filtered[group] = matchingSettings;
      }
    });
    return filtered;
  }, [settings, searchQuery]);

  const renderField = (setting: Setting) => {
    const { key, value } = setting;
    const isPassword = key.includes('password') || key.includes('secret');
    const isBoolean = ['true', 'false'].includes(value) || key.includes('enable') || key.includes('require');
    const isTextarea = key.includes('address') || key.includes('description');
    const isSelect = key === 'timezone' || key === 'theme_mode' || key === 'backup_frequency' || key === 'log_level' || key === 'date_format' || key === 'time_format';
    const isColor = key.includes('color');
    const isNumber = key.includes('length') || key.includes('timeout') || key.includes('attempts') || key.includes('rate') || key.includes('size') || key.includes('port') || key.includes('terms');

    const fieldId = `field-${key}`;
    const fieldLabel = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    if (isBoolean) {
      return (
        <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
          <div className="space-y-1">
            <Label htmlFor={fieldId} className="text-sm font-medium">{fieldLabel}</Label>
            <p className="text-xs text-gray-500">
              {getFieldDescription(key)}
            </p>
          </div>
          <Switch
            id={fieldId}
            checked={form[key] === 'true'}
            onCheckedChange={(checked) => handleInputChange(key, checked ? 'true' : 'false')}
          />
        </div>
      );
    }

    if (isSelect) {
      const getPreview = () => {
        if (key === 'date_format') {
          const now = new Date();
          const formats: Record<string, string> = {
            'Y-m-d': now.toISOString().split('T')[0],
            'm/d/Y': `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`,
            'd/m/Y': `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
            'd-m-Y': `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`,
            'M j, Y': now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            'F j, Y': now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            'j F Y': now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            'D, M j, Y': now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            'l, F j, Y': now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          };
          return formats[form[key]] || 'Preview not available';
        }
        if (key === 'time_format') {
          const now = new Date();
          const formats: Record<string, string> = {
            'H:i': now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
            'h:i A': now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            'H:i:s': now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            'h:i:s A': now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
          };
          return formats[form[key]] || 'Preview not available';
        }
        if (key === 'timezone') {
          const timezone = form[key];
          try {
            const now = new Date();
            const timeInZone = now.toLocaleString('en-US', { 
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            return `Current time: ${timeInZone}`;
          } catch {
            return 'Invalid timezone';
          }
        }
        return null;
      };

      const preview = getPreview();

      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">{fieldLabel}</Label>
          <Select value={form[key]} onValueChange={(value) => handleInputChange(key, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}`} />
            </SelectTrigger>
              <SelectContent className={`${key === 'timezone' ? "max-h-80" : "max-h-60"} backdrop-blur-md bg-white/95 dark:bg-gray-900/95 border border-sky-100 dark:border-gray-800 shadow-2xl rounded-xl overflow-y-auto scrollbar-thin scrollbar-thumb-sky-400 scrollbar-track-transparent`}>
              {key === 'timezone' && (
                <div className="sticky top-0 bg-white border-b p-2 mb-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      placeholder="Search timezones..."
                      className="pl-7 h-8 text-xs"
                      onChange={(e) => {
                        const searchValue = e.target.value.toLowerCase();
                        const items = document.querySelectorAll('[data-timezone-item]');
                        items.forEach((item) => {
                          const text = item.textContent?.toLowerCase() || '';
                          const element = item as HTMLElement;
                          element.style.display = text.includes(searchValue) ? 'block' : 'none';
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              {getSelectOptions(key).map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  data-timezone-item={key === 'timezone' ? 'true' : undefined}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preview && (
            <div className="flex items-center gap-2 p-2 bg-sky-50 border border-sky-200 rounded-md">
              <Clock className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-sky-700 font-medium">Preview: {preview}</span>
            </div>
          )}
          <p className="text-xs text-gray-500">{getFieldDescription(key)}</p>
        </div>
      );
    }

    if (isTextarea) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">{fieldLabel}</Label>
          <Textarea
            id={fieldId}
            value={form[key]}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            rows={3}
          />
          <p className="text-xs text-gray-500">{getFieldDescription(key)}</p>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={fieldId} className="text-sm font-medium">{fieldLabel}</Label>
        <div className="relative">
          <Input
            id={fieldId}
            type={isPassword && !showPasswords[key] ? "password" : isNumber ? "number" : isColor ? "color" : "text"}
            value={form[key]}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            className={isColor ? "h-12" : ""}
          />
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => togglePasswordVisibility(key)}
            >
              {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">{getFieldDescription(key)}</p>
      </div>
    );
  };

  const getFieldDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      hospital_name: "The official name of your hospital or medical facility",
      hospital_address: "Complete address including street, city, state, and postal code",
      hospital_phone: "Main contact phone number for the hospital",
      hospital_email: "Primary email address for official communications",
      hospital_website: "Official website URL (include https://)",
      timezone: "Default timezone for all system operations and user sessions",
      date_format: "Format for displaying dates throughout the system (affects reports, forms, and displays)",
      time_format: "Format for displaying time throughout the system (24-hour or 12-hour format)",
      primary_color: "Main brand color used throughout the interface",
      secondary_color: "Secondary color for accents and highlights",
      logo_url: "URL to your hospital logo image",
      favicon_url: "URL to your website favicon",
      theme_mode: "Default appearance theme for the system",
      email_notifications: "Enable or disable email notifications system-wide",
      sms_notifications: "Enable or disable SMS notifications system-wide",
      notification_email: "Email address to receive system notifications",
      smtp_host: "SMTP server hostname for sending emails",
      smtp_port: "SMTP server port (usually 587 for TLS or 465 for SSL)",
      smtp_username: "Username for SMTP authentication",
      smtp_password: "Password for SMTP authentication",
      password_min_length: "Minimum number of characters required for passwords",
      password_require_uppercase: "Require at least one uppercase letter in passwords",
      password_require_numbers: "Require at least one number in passwords",
      password_require_symbols: "Require at least one special character in passwords",
      session_timeout: "Minutes of inactivity before automatic logout",
      max_login_attempts: "Maximum failed login attempts before account lockout",
      currency_code: "Three-letter ISO currency code (e.g., USD, EUR)",
      currency_symbol: "Symbol to display for currency amounts",
      tax_rate: "Default tax rate percentage for billing",
      invoice_prefix: "Prefix for invoice numbers",
      payment_terms: "Default payment terms in days",
      maintenance_mode: "Put the system in maintenance mode",
      debug_mode: "Enable debug mode for troubleshooting",
      backup_frequency: "How often to perform automatic backups",
      log_level: "Level of detail for system logs",
      max_file_upload_size: "Maximum file size for uploads in MB"
    };
    return descriptions[key] || "Configure this setting according to your needs";
  };

  const getSelectOptions = (key: string) => {
    const options: Record<string, Array<{value: string, label: string}>> = {
      timezone: [
        // UTC
        { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
        
        // Americas
        { value: 'America/New_York', label: 'America/New_York - Eastern Time (UTC-5/-4)' },
        { value: 'America/Chicago', label: 'America/Chicago - Central Time (UTC-6/-5)' },
        { value: 'America/Denver', label: 'America/Denver - Mountain Time (UTC-7/-6)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles - Pacific Time (UTC-8/-7)' },
        { value: 'America/Phoenix', label: 'America/Phoenix - Arizona Time (UTC-7)' },
        { value: 'America/Anchorage', label: 'America/Anchorage - Alaska Time (UTC-9/-8)' },
        { value: 'America/Honolulu', label: 'America/Honolulu - Hawaii Time (UTC-10)' },
        { value: 'America/Toronto', label: 'America/Toronto - Eastern Canada (UTC-5/-4)' },
        { value: 'America/Vancouver', label: 'America/Vancouver - Pacific Canada (UTC-8/-7)' },
        { value: 'America/Mexico_City', label: 'America/Mexico_City - Central Mexico (UTC-6/-5)' },
        { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo - Brazil Time (UTC-3/-2)' },
        { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (UTC-3)' },
        
        // Europe
        { value: 'Europe/London', label: 'Europe/London - Greenwich Mean Time (UTC+0/+1)' },
        { value: 'Europe/Paris', label: 'Europe/Paris - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Rome', label: 'Europe/Rome - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Madrid', label: 'Europe/Madrid - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Stockholm', label: 'Europe/Stockholm - Central European Time (UTC+1/+2)' },
        { value: 'Europe/Moscow', label: 'Europe/Moscow - Moscow Time (UTC+3)' },
        { value: 'Europe/Istanbul', label: 'Europe/Istanbul - Turkey Time (UTC+3)' },
        { value: 'Europe/Athens', label: 'Europe/Athens - Eastern European Time (UTC+2/+3)' },
        
        // Asia
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo - Japan Standard Time (UTC+9)' },
        { value: 'Asia/Shanghai', label: 'Asia/Shanghai - China Standard Time (UTC+8)' },
        { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong - Hong Kong Time (UTC+8)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore - Singapore Time (UTC+8)' },
        { value: 'Asia/Seoul', label: 'Asia/Seoul - Korea Standard Time (UTC+9)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok - Indochina Time (UTC+7)' },
        { value: 'Asia/Jakarta', label: 'Asia/Jakarta - Western Indonesia Time (UTC+7)' },
        { value: 'Asia/Manila', label: 'Asia/Manila - Philippine Time (UTC+8)' },
        { value: 'Asia/Kolkata', label: 'Asia/Kolkata - India Standard Time (UTC+5:30)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai - Gulf Standard Time (UTC+4)' },
        { value: 'Asia/Riyadh', label: 'Asia/Riyadh - Arabia Standard Time (UTC+3)' },
        { value: 'Asia/Tehran', label: 'Asia/Tehran - Iran Standard Time (UTC+3:30/+4:30)' },
        
        // Africa
        { value: 'Africa/Cairo', label: 'Africa/Cairo - Eastern European Time (UTC+2)' },
        { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg - South Africa Time (UTC+2)' },
        { value: 'Africa/Lagos', label: 'Africa/Lagos - West Africa Time (UTC+1)' },
        { value: 'Africa/Nairobi', label: 'Africa/Nairobi - East Africa Time (UTC+3)' },
        
        // Oceania
        { value: 'Australia/Sydney', label: 'Australia/Sydney - Australian Eastern Time (UTC+10/+11)' },
        { value: 'Australia/Melbourne', label: 'Australia/Melbourne - Australian Eastern Time (UTC+10/+11)' },
        { value: 'Australia/Perth', label: 'Australia/Perth - Australian Western Time (UTC+8)' },
        { value: 'Pacific/Auckland', label: 'Pacific/Auckland - New Zealand Time (UTC+12/+13)' },
        { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu - Hawaii-Aleutian Time (UTC-10)' }
      ],
      date_format: [
        { value: 'Y-m-d', label: 'YYYY-MM-DD (2024-12-25)' },
        { value: 'm/d/Y', label: 'MM/DD/YYYY (12/25/2024)' },
        { value: 'd/m/Y', label: 'DD/MM/YYYY (25/12/2024)' },
        { value: 'd-m-Y', label: 'DD-MM-YYYY (25-12-2024)' },
        { value: 'M j, Y', label: 'Month DD, YYYY (Dec 25, 2024)' },
        { value: 'F j, Y', label: 'Full Month DD, YYYY (December 25, 2024)' },
        { value: 'j F Y', label: 'DD Full Month YYYY (25 December 2024)' },
        { value: 'D, M j, Y', label: 'Day, Month DD, YYYY (Wed, Dec 25, 2024)' },
        { value: 'l, F j, Y', label: 'Full Day, Full Month DD, YYYY (Wednesday, December 25, 2024)' }
      ],
      time_format: [
        { value: 'H:i', label: '24-hour format (14:30)' },
        { value: 'h:i A', label: '12-hour format (2:30 PM)' },
        { value: 'H:i:s', label: '24-hour with seconds (14:30:45)' },
        { value: 'h:i:s A', label: '12-hour with seconds (2:30:45 PM)' }
      ],
      theme_mode: [
        { value: 'light', label: 'Light Theme' },
        { value: 'dark', label: 'Dark Theme' },
        { value: 'auto', label: 'Auto (System)' }
      ],
      backup_frequency: [
        { value: 'hourly', label: 'Every Hour' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ],
      log_level: [
        { value: 'debug', label: 'Debug' },
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' }
      ]
    };
    return options[key] || [];
  };

  return (
    <AdminLayout>
      <Head title="System Settings - MediCare HMS" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-sky-600" />
                  System Settings
                </h1>
                <p className="text-gray-600 mt-2">Configure your hospital management system</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Unsaved changes
                    </Badge>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={resetToDefaults}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!hasChanges || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/80 backdrop-blur-sm border shadow-sm">
              {Object.entries(categories).map(([key, category]) => {
                const IconComponent = iconMap[category.icon as keyof typeof iconMap];
                const hasFilteredSettings = filteredSettings[key]?.length > 0;
                const isVisible = !searchQuery || hasFilteredSettings;
                
                if (!isVisible) return null;
                
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 text-xs lg:text-sm"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.title}</span>
                    {searchQuery && hasFilteredSettings && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {filteredSettings[key].length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(categories).map(([key, category]) => {
              const categorySettings = filteredSettings[key] || [];
              const IconComponent = iconMap[category.icon as keyof typeof iconMap];
              
              return (
                <TabsContent key={key} value={key} className="space-y-6">
                  <Card className="backdrop-blur-md bg-white/90 shadow-xl border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-sky-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-sky-600" />
                        </div>
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {categorySettings.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {categorySettings.map(renderField)}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <IconComponent className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>
                            {searchQuery 
                              ? `No settings found matching "${searchQuery}" in this category.`
                              : "No settings available in this category yet."
                            }
                          </p>
                          {searchQuery && (
                            <Button 
                              variant="outline" 
                              onClick={() => setSearchQuery('')}
                              className="mt-4"
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
