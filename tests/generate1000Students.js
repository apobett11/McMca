/**
 * 1,000 Students Generator for McMCA Full Year Simulation Test
 * Accurately distributes 1,000 students across 12 locations and schools
 * with authentic Kenyan names, ID numbers, demographic categories, 
 * fee balances, and bursary allocations.
 */

export const LOCATIONS_12 = [
  { name: 'Tendeno Central', ward: 'Tendeno/Sorget Ward', pollingStation: 'Tendeno Primary Polling Station', targetCount: 90 },
  { name: 'Tendeno East', ward: 'Tendeno/Sorget Ward', pollingStation: 'Tendeno Primary Polling Station', targetCount: 80 },
  { name: 'Tendeno West', ward: 'Tendeno/Sorget Ward', pollingStation: 'Tendeno Primary Polling Station', targetCount: 75 },
  { name: 'Sorget Central', ward: 'Tendeno/Sorget Ward', pollingStation: 'Sorget Forest Polling Station', targetCount: 95 },
  { name: 'Sorget Forest', ward: 'Tendeno/Sorget Ward', pollingStation: 'Sorget Forest Polling Station', targetCount: 85 },
  { name: 'Kipchorian', ward: 'Tendeno/Sorget Ward', pollingStation: 'Sorget Forest Polling Station', targetCount: 80 },
  { name: 'Kapkures', ward: 'Tendeno/Sorget Ward', pollingStation: 'Kapkures Tea Nursery Polling Station', targetCount: 90 },
  { name: 'Chepsir', ward: 'Tendeno/Sorget Ward', pollingStation: 'Chepsir Primary Polling Station', targetCount: 85 },
  { name: 'Kapsebet', ward: 'Tendeno/Sorget Ward', pollingStation: 'Kapsebet ECDE Polling Station', targetCount: 80 },
  { name: 'Kapchelach', ward: 'Tendeno/Sorget Ward', pollingStation: 'Kapchelach Dispensary Polling Station', targetCount: 80 },
  { name: 'Highridge', ward: 'Parklands Ward', pollingStation: 'Highridge Primary Polling Station', targetCount: 80 },
  { name: 'Spring Valley', ward: 'Parklands Ward', pollingStation: 'Spring Valley Polling Station', targetCount: 80 }
];

export const SCHOOLS = [
  // Secondary
  { name: 'Kipsigis High School', level: 'Secondary', avgFee: 45000, bursary: 15000 },
  { name: 'Chepsir Secondary School', level: 'Secondary', avgFee: 32000, bursary: 12000 },
  { name: 'Sorget Secondary School', level: 'Secondary', avgFee: 28000, bursary: 10000 },
  { name: 'Tendeno Day Secondary School', level: 'Secondary', avgFee: 22000, bursary: 8000 },
  { name: 'Kapkures Secondary School', level: 'Secondary', avgFee: 26000, bursary: 10000 },
  { name: 'Highridge Secondary School', level: 'Secondary', avgFee: 40000, bursary: 14000 },
  // Primary
  { name: 'Tendeno Primary School', level: 'Primary', avgFee: 12000, bursary: 5000 },
  { name: 'Sorget Primary School', level: 'Primary', avgFee: 10000, bursary: 5000 },
  { name: 'Kapkures Primary School', level: 'Primary', avgFee: 11000, bursary: 5000 },
  { name: 'Chepsir Primary School', level: 'Primary', avgFee: 10000, bursary: 5000 },
  { name: 'Kapsebet ECDE & Primary', level: 'Primary', avgFee: 9000, bursary: 4000 },
  { name: 'St. Mary Primary School', level: 'Primary', avgFee: 15000, bursary: 6000 },
  // TVET / Vocational
  { name: 'Tendeno Vocational Training Centre', level: 'TVET / Vocational', avgFee: 22000, bursary: 18000 },
  { name: 'Sorget Technical & Agricultural Institute', level: 'TVET / Vocational', avgFee: 26000, bursary: 20000 },
  { name: 'Kapkures Youth Polytechnic', level: 'TVET / Vocational', avgFee: 18000, bursary: 15000 },
  { name: 'Chepsir Technical Training Institute', level: 'TVET / Vocational', avgFee: 24000, bursary: 18000 },
  { name: 'Kapsebet Community College', level: 'TVET / Vocational', avgFee: 20000, bursary: 16000 },
  { name: 'Kapchelach Skills Innovation Hub', level: 'TVET / Vocational', avgFee: 19000, bursary: 19000 },
  // University
  { name: 'Egerton University', level: 'University', avgFee: 75000, bursary: 25000 },
  { name: 'Moi University', level: 'University', avgFee: 80000, bursary: 25000 },
  { name: 'University of Nairobi', level: 'University', avgFee: 90000, bursary: 30000 },
  { name: 'Kenyatta University', level: 'University', avgFee: 85000, bursary: 28000 }
];

const FIRST_NAMES_MALE = ['Brian', 'Kevin', 'Denis', 'Kiprotich', 'Collins', 'Festus', 'Kipkoech', 'Emanuel', 'Vincent', 'Meshack', 'Geoffrey', 'Kiprono', 'Kipngetich', 'Titus', 'Victor'];
const FIRST_NAMES_FEMALE = ['Mercy', 'Sharon', 'Faith', 'Chepkoech', 'Brenda', 'Diana', 'Dorcas', 'Gladys', 'Jackline', 'Chebet', 'Cherotich', 'Lilian', 'Naomi', 'Sheila', 'Cynthia'];
const LAST_NAMES = ['Koech', 'Langat', 'Bett', 'Rono', 'Cheruiyot', 'Kipruto', 'Chepkwony', 'Kipkirui', 'Rotich', 'Kiplangat', 'Sang', 'Korir', 'Keter', 'Kemei', 'Mutai'];

const PARENT_FIRST_NAMES = ['John', 'Peter', 'David', 'Wilson', 'Ezekiel', 'Grace', 'Mary', 'Alice', 'Sarah', 'Esther', 'Rose', 'Hellen'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

export function generate1000Students() {
  const students = [];
  let serialCounter = 1;

  LOCATIONS_12.forEach((loc, locIndex) => {
    for (let i = 0; i < loc.targetCount; i++) {
      const isMale = (serialCounter + i) % 2 === 0;
      const firstName = isMale 
        ? FIRST_NAMES_MALE[(serialCounter + i) % FIRST_NAMES_MALE.length]
        : FIRST_NAMES_FEMALE[(serialCounter + i) % FIRST_NAMES_FEMALE.length];
      const lastName = LAST_NAMES[(serialCounter * 3 + i) % LAST_NAMES.length];
      const parentFirst = PARENT_FIRST_NAMES[(serialCounter + i) % PARENT_FIRST_NAMES.length];
      const parentName = `${parentFirst} ${lastName}`;

      // Pick school appropriate for location or general
      const school = SCHOOLS[(serialCounter * 7 + i) % SCHOOLS.length];
      
      // Age bracket determination
      let age = 16;
      let ageBracket = '15 - 18';
      if (school.level === 'Primary') {
        age = 12 + (i % 3);
        ageBracket = 'Under 15';
      } else if (school.level === 'Secondary') {
        age = 14 + (i % 4);
        ageBracket = age < 15 ? 'Under 15' : '15 - 18';
      } else if (school.level === 'TVET / Vocational') {
        age = 18 + (i % 5);
        ageBracket = age <= 18 ? '15 - 18' : (age <= 22 ? '19 - 22' : '23 and above');
      } else {
        age = 20 + (i % 5);
        ageBracket = age <= 22 ? '19 - 22' : '23 and above';
      }

      const nationalId = String(35000000 + serialCounter);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${serialCounter}@student.ac.ke`;
      const phone = `+254 7${String(10000000 + (serialCounter * 137) % 89999999).slice(0, 8)}`;
      const parentPhone = `+254 7${String(20000000 + (serialCounter * 239) % 79999999).slice(0, 8)}`;

      const month = MONTHS[i % MONTHS.length];
      const week = WEEKS[i % WEEKS.length];
      const day = String(1 + (i % 27)).padStart(2, '0');
      const monthNum = String(1 + (i % 6)).padStart(2, '0');
      const submittedDate = `2026-${monthNum}-${day}`;

      // Mark occasional suspicious flag for Chief review verification test (2% of students)
      const isSuspicious = (serialCounter % 50 === 0);
      const suspicionReason = isSuspicious ? 'National ID registered in Eldoret West; applicant claims residency in Tendeno.' : '';

      // Need score
      const needScore = (serialCounter % 3 === 0) ? 'Extreme Hardship / Orphan' : ((serialCounter % 2 === 0) ? 'High Need' : 'Moderate Need');

      students.push({
        id: `app-26-${String(serialCounter).padStart(4, '0')}`,
        year: '2026/2027',
        serial: `BUR-26-${String(serialCounter).padStart(4, '0')}`,
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        gender: isMale ? 'Male' : 'Female',
        nationalId,
        email,
        phone,
        parentName,
        parentPhone,
        school: school.name,
        educationLevel: school.level,
        pollingStation: loc.pollingStation,
        location: loc.name,
        village: loc.name,
        ward: loc.ward,
        age,
        ageBracket,
        feeBalance: school.avgFee,
        bursaryAmount: school.bursary,
        allocatedAmount: school.bursary,
        month,
        week,
        submittedDate,
        status: 'Allocated', // Initial baseline state
        isSuspicious,
        suspicionReason,
        needScore,
        idLocation: isSuspicious ? 'Eldoret West' : loc.name
      });

      serialCounter++;
    }
  });

  return students;
}
