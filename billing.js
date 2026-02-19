import codes from '../data/codes.json';

export function suggestCodes(specialty, age) {
    const specialtyData = codes.specialties[specialty];
    if (!specialtyData) return [];

    let ageRange = Object.keys(specialtyData).find(range => {
        const [min, max] = range.split('-').map(Number);
        return age >= min && age <= max;
    });

    if (!ageRange) return [];

    return specialtyData[ageRange];2
}
