import type { FamilyMember } from '../types/family';

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getYearFromDate(dateString?: string): string {
  if (!dateString) return '?';
  return new Date(dateString).getFullYear().toString();
}

export function getYearsRange(member: FamilyMember): string {
  const birthYear = getYearFromDate(member.birthDate);
  const deathYear = member.deathDate ? getYearFromDate(member.deathDate) : '';

  if (deathYear) {
    return `${birthYear} — ${deathYear}`;
  }
  return `р. ${birthYear}`;
}

export function getFullName(member: FamilyMember): string {
  const parts = [member.lastName, member.firstName];
  if (member.patronymic) {
    parts.push(member.patronymic);
  }
  return parts.join(' ');
}

export function getShortName(member: FamilyMember): string {
  return `${member.firstName} ${member.lastName}`;
}

export function generateId(name: string): string {
  const timestamp = Date.now();
  const cleanName = name
    .toLowerCase()
    .replace(/[а-яё]/gi, (char) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      };
      return map[char.toLowerCase()] || char;
    })
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanName}-${timestamp}`;
}

export function calculateAge(birthDate?: string, deathDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
