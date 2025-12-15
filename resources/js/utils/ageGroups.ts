export interface AgeGroup {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export const AGE_GROUPS: AgeGroup[] = [
  {
    name: 'Newborn',
    min: 0,
    max: 0.08, // ~1 month
    color: 'bg-pink-100 text-pink-800',
    description: '0-1 month'
  },
  {
    name: 'Infant',
    min: 0.08,
    max: 2,
    color: 'bg-pink-100 text-pink-800',
    description: '1 month - 2 years'
  },
  {
    name: 'Child',
    min: 2,
    max: 12,
    color: 'bg-blue-100 text-blue-800',
    description: '2-12 years'
  },
  {
    name: 'Adolescent',
    min: 12,
    max: 18,
    color: 'bg-purple-100 text-purple-800',
    description: '12-18 years'
  },
  {
    name: 'Young Adult',
    min: 18,
    max: 35,
    color: 'bg-green-100 text-green-800',
    description: '18-35 years'
  },
  {
    name: 'Adult',
    min: 35,
    max: 65,
    color: 'bg-teal-100 text-teal-800',
    description: '35-65 years'
  },
  {
    name: 'Senior',
    min: 65,
    max: Infinity,
    color: 'bg-orange-100 text-orange-800',
    description: '65+ years'
  }
];

export function calculateAge(dateOfBirth: string | Date): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getAgeGroup(age: number): AgeGroup {
  return AGE_GROUPS.find(group => age >= group.min && age < group.max) || AGE_GROUPS[AGE_GROUPS.length - 1];
}

export function getAgeGroupFromBirthDate(dateOfBirth: string | Date): AgeGroup {
  const age = calculateAge(dateOfBirth);
  return getAgeGroup(age);
}

export function formatAge(dateOfBirth: string | Date): string {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  const days = today.getDate() - birth.getDate();
  
  // For very young patients, show months and days
  if (years === 0) {
    if (months === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  // For patients under 2, show years and months
  if (years < 2) {
    const adjustedMonths = months < 0 ? months + 12 : months;
    if (adjustedMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
  }
  
  // For older patients, just show years
  return `${years} year${years !== 1 ? 's' : ''}`;
}

export function getMedicalAlerts(patient: {
  age: number;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
}): Array<{
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}> {
  const alerts = [];
  
  // Age-based alerts
  if (patient.age >= 65) {
    alerts.push({
      type: 'Age Alert',
      message: 'Senior patient - consider age-related medication adjustments',
      severity: 'medium' as const
    });
  }
  
  if (patient.age < 2) {
    alerts.push({
      type: 'Pediatric Alert',
      message: 'Infant/toddler - special dosing considerations required',
      severity: 'high' as const
    });
  }
  
  // Allergy alerts
  if (patient.allergies && patient.allergies.trim()) {
    const allergies = patient.allergies.split(',').map(a => a.trim()).filter(a => a);
    if (allergies.length > 0) {
      alerts.push({
        type: 'Allergy Alert',
        message: `Allergies: ${allergies.join(', ')}`,
        severity: 'high' as const
      });
    }
  }
  
  // Chronic condition alerts
  if (patient.chronic_conditions && patient.chronic_conditions.trim()) {
    const conditions = patient.chronic_conditions.split(',').map(c => c.trim()).filter(c => c);
    if (conditions.length > 0) {
      alerts.push({
        type: 'Chronic Conditions',
        message: `Conditions: ${conditions.join(', ')}`,
        severity: 'medium' as const
      });
    }
  }
  
  // Medication alerts
  if (patient.current_medications && patient.current_medications.trim()) {
    const medicationCount = patient.current_medications.split(',').length;
    if (medicationCount >= 5) {
      alerts.push({
        type: 'Polypharmacy Alert',
        message: `Patient is on ${medicationCount} medications - check for interactions`,
        severity: 'medium' as const
      });
    }
  }
  
  return alerts;
}

export function getAgeGroupStatistics(patients: Array<{ date_of_birth: string }>): Array<{
  group: string;
  count: number;
  percentage: number;
  color: string;
}> {
  const groupCounts = AGE_GROUPS.reduce((acc, group) => {
    acc[group.name] = 0;
    return acc;
  }, {} as Record<string, number>);
  
  patients.forEach(patient => {
    const ageGroup = getAgeGroupFromBirthDate(patient.date_of_birth);
    groupCounts[ageGroup.name]++;
  });
  
  const total = patients.length;
  
  return AGE_GROUPS.map(group => ({
    group: group.name,
    count: groupCounts[group.name],
    percentage: total > 0 ? Math.round((groupCounts[group.name] / total) * 100) : 0,
    color: group.color
  })).filter(stat => stat.count > 0);
}