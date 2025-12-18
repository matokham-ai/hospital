<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class Icd10CodesSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $codes = [
            // INFECTIOUS & PARASITIC DISEASES - HIGH PRIORITY IN KENYA

            // Malaria - Leading cause of morbidity in Kenya
            ['code' => 'B50.9', 'description' => 'Plasmodium falciparum malaria, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Malaria'],
            ['code' => 'B50.0', 'description' => 'Plasmodium falciparum malaria with cerebral complications', 'category' => 'Infectious Diseases', 'subcategory' => 'Malaria'],
            ['code' => 'B51.9', 'description' => 'Plasmodium vivax malaria, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Malaria'],
            ['code' => 'B52.9', 'description' => 'Plasmodium malariae malaria, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Malaria'],
            ['code' => 'B54', 'description' => 'Malaria, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Malaria'],

            // HIV/AIDS - Major public health concern in Kenya
            ['code' => 'B20', 'description' => 'Human immunodeficiency virus [HIV] disease', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],
            ['code' => 'B21', 'description' => 'HIV disease resulting in Kaposi sarcoma', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],
            ['code' => 'B22', 'description' => 'HIV disease resulting in other specified diseases', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],
            ['code' => 'B23', 'description' => 'HIV disease resulting in other conditions', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],
            ['code' => 'B24', 'description' => 'Unspecified HIV disease', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],
            ['code' => 'Z21', 'description' => 'Asymptomatic HIV infection status', 'category' => 'Infectious Diseases', 'subcategory' => 'HIV/AIDS'],

            // Tuberculosis - High burden in Kenya
            ['code' => 'A15.0', 'description' => 'Tuberculosis of lung, confirmed by sputum microscopy', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A15.9', 'description' => 'Respiratory tuberculosis unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A16.9', 'description' => 'Respiratory tuberculosis, not confirmed bacteriologically or histologically', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A17.0', 'description' => 'Tuberculous meningitis', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A18.0', 'description' => 'Tuberculosis of bones and joints', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A18.1', 'description' => 'Tuberculosis of genitourinary system', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],
            ['code' => 'A19.9', 'description' => 'Miliary tuberculosis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Tuberculosis'],

            // Typhoid fever - Common in Kenya
            ['code' => 'A01.0', 'description' => 'Typhoid fever', 'category' => 'Infectious Diseases', 'subcategory' => 'Enteric Fever'],
            ['code' => 'A01.1', 'description' => 'Paratyphoid fever A', 'category' => 'Infectious Diseases', 'subcategory' => 'Enteric Fever'],
            ['code' => 'A01.4', 'description' => 'Paratyphoid fever, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Enteric Fever'],

            // Diarrheal diseases - Major cause of morbidity
            ['code' => 'A09', 'description' => 'Infectious gastroenteritis and colitis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A09.0', 'description' => 'Other and unspecified gastroenteritis and colitis of infectious origin', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A00.9', 'description' => 'Cholera, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A03.9', 'description' => 'Shigellosis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A02.0', 'description' => 'Salmonella enteritis', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A07.1', 'description' => 'Giardiasis', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A06.0', 'description' => 'Acute amoebic dysentery', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],
            ['code' => 'A06.9', 'description' => 'Amoebiasis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Diarrheal Diseases'],

            // Helminth infections - Common parasitic infections
            ['code' => 'B76.9', 'description' => 'Hookworm disease, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Helminth Infections'],
            ['code' => 'B77.9', 'description' => 'Ascariasis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Helminth Infections'],
            ['code' => 'B65.9', 'description' => 'Schistosomiasis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Helminth Infections'],
            ['code' => 'B79', 'description' => 'Trichuriasis', 'category' => 'Infectious Diseases', 'subcategory' => 'Helminth Infections'],
            ['code' => 'B83.9', 'description' => 'Helminthiasis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Helminth Infections'],

            // Brucellosis - Endemic in pastoral areas
            ['code' => 'A23.9', 'description' => 'Brucellosis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Zoonotic Diseases'],

            // Rabies - Present in Kenya
            ['code' => 'A82.9', 'description' => 'Rabies, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Zoonotic Diseases'],

            // COVID-19
            ['code' => 'U07.1', 'description' => 'COVID-19, virus identified', 'category' => 'Infectious Diseases', 'subcategory' => 'Viral Respiratory'],
            ['code' => 'U09.9', 'description' => 'Post COVID-19 condition, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Viral Respiratory'],

            // Measles - Still occurring despite vaccination
            ['code' => 'B05.9', 'description' => 'Measles without complication', 'category' => 'Infectious Diseases', 'subcategory' => 'Vaccine-Preventable'],
            ['code' => 'B05.0', 'description' => 'Measles complicated by encephalitis', 'category' => 'Infectious Diseases', 'subcategory' => 'Vaccine-Preventable'],

            // Other common viral infections
            ['code' => 'B01.9', 'description' => 'Varicella without complication', 'category' => 'Infectious Diseases', 'subcategory' => 'Viral Infections'],
            ['code' => 'B27.9', 'description' => 'Infectious mononucleosis, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Viral Infections'],
            ['code' => 'B34.9', 'description' => 'Viral infection, unspecified', 'category' => 'Infectious Diseases', 'subcategory' => 'Viral Infections'],

            // RESPIRATORY DISEASES
            ['code' => 'J06.9', 'description' => 'Acute upper respiratory infection, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Upper Respiratory Infections'],
            ['code' => 'J00', 'description' => 'Acute nasopharyngitis (common cold)', 'category' => 'Respiratory', 'subcategory' => 'Upper Respiratory Infections'],
            ['code' => 'J02.9', 'description' => 'Acute pharyngitis, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Upper Respiratory Infections'],
            ['code' => 'J03.9', 'description' => 'Acute tonsillitis, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Upper Respiratory Infections'],
            ['code' => 'J18.9', 'description' => 'Pneumonia, unspecified organism', 'category' => 'Respiratory', 'subcategory' => 'Lower Respiratory Infections'],
            ['code' => 'J12.9', 'description' => 'Viral pneumonia, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Lower Respiratory Infections'],
            ['code' => 'J15.9', 'description' => 'Bacterial pneumonia, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Lower Respiratory Infections'],
            ['code' => 'J20.9', 'description' => 'Acute bronchitis, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Bronchitis'],
            ['code' => 'J45.9', 'description' => 'Asthma, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Chronic Respiratory'],
            ['code' => 'J44.9', 'description' => 'Chronic obstructive pulmonary disease, unspecified', 'category' => 'Respiratory', 'subcategory' => 'Chronic Respiratory'],

            // CARDIOVASCULAR DISEASES - Rising in Kenya
            ['code' => 'I10', 'description' => 'Essential (primary) hypertension', 'category' => 'Cardiovascular', 'subcategory' => 'Hypertension'],
            ['code' => 'I11.9', 'description' => 'Hypertensive heart disease without heart failure', 'category' => 'Cardiovascular', 'subcategory' => 'Hypertension'],
            ['code' => 'I21.9', 'description' => 'Acute myocardial infarction, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Ischemic Heart Disease'],
            ['code' => 'I20.9', 'description' => 'Angina pectoris, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Ischemic Heart Disease'],
            ['code' => 'I25.9', 'description' => 'Chronic ischemic heart disease, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Ischemic Heart Disease'],
            ['code' => 'I50.9', 'description' => 'Heart failure, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Heart Failure'],
            ['code' => 'I63.9', 'description' => 'Cerebral infarction, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Cerebrovascular'],
            ['code' => 'I64', 'description' => 'Stroke, not specified as haemorrhage or infarction', 'category' => 'Cardiovascular', 'subcategory' => 'Cerebrovascular'],
            ['code' => 'I01.9', 'description' => 'Acute rheumatic heart disease, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Rheumatic Heart Disease'],
            ['code' => 'I05.9', 'description' => 'Rheumatic mitral valve disease, unspecified', 'category' => 'Cardiovascular', 'subcategory' => 'Rheumatic Heart Disease'],

            // DIABETES & ENDOCRINE
            ['code' => 'E11.9', 'description' => 'Type 2 diabetes mellitus without complications', 'category' => 'Endocrine', 'subcategory' => 'Diabetes'],
            ['code' => 'E11.6', 'description' => 'Type 2 diabetes mellitus with other specified complications', 'category' => 'Endocrine', 'subcategory' => 'Diabetes'],
            ['code' => 'E10.9', 'description' => 'Type 1 diabetes mellitus without complications', 'category' => 'Endocrine', 'subcategory' => 'Diabetes'],
            ['code' => 'E14.9', 'description' => 'Unspecified diabetes mellitus without complications', 'category' => 'Endocrine', 'subcategory' => 'Diabetes'],
            ['code' => 'E46', 'description' => 'Unspecified protein-energy malnutrition', 'category' => 'Endocrine', 'subcategory' => 'Malnutrition'],
            ['code' => 'E43', 'description' => 'Unspecified severe protein-energy malnutrition', 'category' => 'Endocrine', 'subcategory' => 'Malnutrition'],
            ['code' => 'E66.9', 'description' => 'Obesity, unspecified', 'category' => 'Endocrine', 'subcategory' => 'Obesity'],
            ['code' => 'E04.9', 'description' => 'Nontoxic goitre, unspecified', 'category' => 'Endocrine', 'subcategory' => 'Thyroid Disorders'],

            // ANEMIA - Very common in Kenya
            ['code' => 'D50.9', 'description' => 'Iron deficiency anaemia, unspecified', 'category' => 'Blood Disorders', 'subcategory' => 'Anemia'],
            ['code' => 'D53.9', 'description' => 'Nutritional anaemia, unspecified', 'category' => 'Blood Disorders', 'subcategory' => 'Anemia'],
            ['code' => 'D64.9', 'description' => 'Anaemia, unspecified', 'category' => 'Blood Disorders', 'subcategory' => 'Anemia'],
            ['code' => 'D57.1', 'description' => 'Sickle-cell disease without crisis', 'category' => 'Blood Disorders', 'subcategory' => 'Hemoglobinopathies'],

            // MATERNAL & PERINATAL CONDITIONS
            ['code' => 'O80', 'description' => 'Single spontaneous delivery', 'category' => 'Maternal Health', 'subcategory' => 'Normal Delivery'],
            ['code' => 'O14.9', 'description' => 'Pre-eclampsia, unspecified', 'category' => 'Maternal Health', 'subcategory' => 'Pregnancy Complications'],
            ['code' => 'O15.9', 'description' => 'Eclampsia, unspecified as to time period', 'category' => 'Maternal Health', 'subcategory' => 'Pregnancy Complications'],
            ['code' => 'O62.0', 'description' => 'Primary inadequate contractions', 'category' => 'Maternal Health', 'subcategory' => 'Labour Complications'],
            ['code' => 'O72.0', 'description' => 'Third-stage haemorrhage', 'category' => 'Maternal Health', 'subcategory' => 'Postpartum Hemorrhage'],
            ['code' => 'O72.1', 'description' => 'Other immediate postpartum haemorrhage', 'category' => 'Maternal Health', 'subcategory' => 'Postpartum Hemorrhage'],
            ['code' => 'O85', 'description' => 'Puerperal sepsis', 'category' => 'Maternal Health', 'subcategory' => 'Postpartum Complications'],
            ['code' => 'O03.9', 'description' => 'Spontaneous abortion, complete or unspecified, without complication', 'category' => 'Maternal Health', 'subcategory' => 'Abortion'],
            ['code' => 'O06.9', 'description' => 'Unspecified abortion, complete or unspecified, without complication', 'category' => 'Maternal Health', 'subcategory' => 'Abortion'],
            ['code' => 'O98.7', 'description' => 'HIV disease complicating pregnancy, childbirth and the puerperium', 'category' => 'Maternal Health', 'subcategory' => 'HIV in Pregnancy'],

            // NEONATAL & PEDIATRIC
            ['code' => 'P07.3', 'description' => 'Preterm newborn, unspecified weeks of gestation', 'category' => 'Neonatal', 'subcategory' => 'Prematurity'],
            ['code' => 'P22.0', 'description' => 'Respiratory distress syndrome of newborn', 'category' => 'Neonatal', 'subcategory' => 'Respiratory Distress'],
            ['code' => 'P59.9', 'description' => 'Neonatal jaundice, unspecified', 'category' => 'Neonatal', 'subcategory' => 'Jaundice'],
            ['code' => 'P36.9', 'description' => 'Bacterial sepsis of newborn, unspecified', 'category' => 'Neonatal', 'subcategory' => 'Neonatal Sepsis'],
            ['code' => 'P05.1', 'description' => 'Small for gestational age', 'category' => 'Neonatal', 'subcategory' => 'Birth Weight'],
            ['code' => 'A37.9', 'description' => 'Whooping cough, unspecified', 'category' => 'Pediatric', 'subcategory' => 'Vaccine-Preventable'],

            // INJURIES & TRAUMA - Road traffic accidents common
            ['code' => 'S06.9', 'description' => 'Intracranial injury, unspecified', 'category' => 'Injury/Trauma', 'subcategory' => 'Head Injury'],
            ['code' => 'S72.9', 'description' => 'Fracture of femur, unspecified', 'category' => 'Injury/Trauma', 'subcategory' => 'Fractures'],
            ['code' => 'S82.9', 'description' => 'Fracture of lower leg, unspecified', 'category' => 'Injury/Trauma', 'subcategory' => 'Fractures'],
            ['code' => 'T14.9', 'description' => 'Injury, unspecified', 'category' => 'Injury/Trauma', 'subcategory' => 'General Injury'],
            ['code' => 'T30.0', 'description' => 'Burn of unspecified body region, unspecified degree', 'category' => 'Injury/Trauma', 'subcategory' => 'Burns'],
            ['code' => 'X59', 'description' => 'Exposure to unspecified factor', 'category' => 'Injury/Trauma', 'subcategory' => 'Environmental'],

            // CANCERS - Growing concern
            ['code' => 'C53.9', 'description' => 'Malignant neoplasm of cervix uteri, unspecified', 'category' => 'Oncology', 'subcategory' => 'Cervical Cancer'],
            ['code' => 'C50.9', 'description' => 'Malignant neoplasm of breast, unspecified', 'category' => 'Oncology', 'subcategory' => 'Breast Cancer'],
            ['code' => 'C16.9', 'description' => 'Malignant neoplasm of stomach, unspecified', 'category' => 'Oncology', 'subcategory' => 'Gastric Cancer'],
            ['code' => 'C22.9', 'description' => 'Malignant neoplasm of liver, unspecified', 'category' => 'Oncology', 'subcategory' => 'Liver Cancer'],
            ['code' => 'C18.9', 'description' => 'Malignant neoplasm of colon, unspecified', 'category' => 'Oncology', 'subcategory' => 'Colorectal Cancer'],
            ['code' => 'C64.9', 'description' => 'Malignant neoplasm of kidney, unspecified', 'category' => 'Oncology', 'subcategory' => 'Kidney Cancer'],

            // MENTAL HEALTH
            ['code' => 'F32.9', 'description' => 'Major depressive disorder, single episode, unspecified', 'category' => 'Mental Health', 'subcategory' => 'Depression'],
            ['code' => 'F41.9', 'description' => 'Anxiety disorder, unspecified', 'category' => 'Mental Health', 'subcategory' => 'Anxiety'],
            ['code' => 'F10.2', 'description' => 'Alcohol dependence syndrome', 'category' => 'Mental Health', 'subcategory' => 'Substance Abuse'],
            ['code' => 'F20.9', 'description' => 'Schizophrenia, unspecified', 'category' => 'Mental Health', 'subcategory' => 'Psychotic Disorders'],

            // RENAL & URINARY
            ['code' => 'N39.0', 'description' => 'Urinary tract infection, site not specified', 'category' => 'Renal/Urinary', 'subcategory' => 'Urinary Tract Infections'],
            ['code' => 'N18.9', 'description' => 'Chronic kidney disease, unspecified', 'category' => 'Renal/Urinary', 'subcategory' => 'Chronic Kidney Disease'],
            ['code' => 'N17.9', 'description' => 'Acute kidney failure, unspecified', 'category' => 'Renal/Urinary', 'subcategory' => 'Acute Kidney Injury'],

            // GASTROINTESTINAL
            ['code' => 'K29.9', 'description' => 'Gastritis, unspecified', 'category' => 'Gastrointestinal', 'subcategory' => 'Gastritis'],
            ['code' => 'K35.80', 'description' => 'Unspecified acute appendicitis', 'category' => 'Gastrointestinal', 'subcategory' => 'Appendicitis'],
            ['code' => 'K80.5', 'description' => 'Calculus of bile duct without cholangitis or cholecystitis', 'category' => 'Gastrointestinal', 'subcategory' => 'Biliary Disease'],
            ['code' => 'K76.9', 'description' => 'Liver disease, unspecified', 'category' => 'Gastrointestinal', 'subcategory' => 'Liver Disease'],

            // MUSCULOSKELETAL
            ['code' => 'M54.5', 'description' => 'Low back pain', 'category' => 'Musculoskeletal', 'subcategory' => 'Back Pain'],
            ['code' => 'M25.5', 'description' => 'Joint pain', 'category' => 'Musculoskeletal', 'subcategory' => 'Arthralgia'],
            ['code' => 'M79.1', 'description' => 'Myalgia', 'category' => 'Musculoskeletal', 'subcategory' => 'Muscle Pain'],
            ['code' => 'M19.9', 'description' => 'Osteoarthritis, unspecified', 'category' => 'Musculoskeletal', 'subcategory' => 'Arthritis'],

            // EYE & EAR
            ['code' => 'H10.9', 'description' => 'Conjunctivitis, unspecified', 'category' => 'Eye', 'subcategory' => 'Eye Infections'],
            ['code' => 'H25.9', 'description' => 'Senile cataract, unspecified', 'category' => 'Eye', 'subcategory' => 'Cataract'],
            ['code' => 'H52.1', 'description' => 'Myopia', 'category' => 'Eye', 'subcategory' => 'Refractive Errors'],
            ['code' => 'H66.9', 'description' => 'Otitis media, unspecified', 'category' => 'Ear', 'subcategory' => 'Ear Infections'],

            // SKIN CONDITIONS
            ['code' => 'L20.9', 'description' => 'Atopic dermatitis, unspecified', 'category' => 'Dermatology', 'subcategory' => 'Dermatitis'],
            ['code' => 'L03.90', 'description' => 'Cellulitis, unspecified', 'category' => 'Dermatology', 'subcategory' => 'Skin Infections'],
            ['code' => 'L08.9', 'description' => 'Local infection of skin and subcutaneous tissue, unspecified', 'category' => 'Dermatology', 'subcategory' => 'Skin Infections'],
            ['code' => 'L50.9', 'description' => 'Urticaria, unspecified', 'category' => 'Dermatology', 'subcategory' => 'Allergic Reactions'],

            // SYMPTOMS & SIGNS - Common presentations
            ['code' => 'R50.9', 'description' => 'Fever, unspecified', 'category' => 'Symptoms', 'subcategory' => 'General Symptoms'],
            ['code' => 'R51', 'description' => 'Headache', 'category' => 'Symptoms', 'subcategory' => 'Neurological Symptoms'],
            ['code' => 'R05', 'description' => 'Cough', 'category' => 'Symptoms', 'subcategory' => 'Respiratory Symptoms'],
            ['code' => 'R10.9', 'description' => 'Abdominal pain, unspecified', 'category' => 'Symptoms', 'subcategory' => 'Abdominal Symptoms'],
            ['code' => 'R53', 'description' => 'Malaise and fatigue', 'category' => 'Symptoms', 'subcategory' => 'General Symptoms'],

            // PREVENTIVE CARE
            ['code' => 'Z23', 'description' => 'Need for immunization against single bacterial diseases', 'category' => 'Preventive Care', 'subcategory' => 'Immunization'],
            ['code' => 'Z00.0', 'description' => 'General medical examination', 'category' => 'Preventive Care', 'subcategory' => 'Health Screening'],
            ['code' => 'Z11.3', 'description' => 'Screening for infections with a predominantly sexual mode of transmission', 'category' => 'Preventive Care', 'subcategory' => 'STI Screening'],
        ];

        // Add timestamps and defaults
        $records = array_map(fn($code) => array_merge($code, [
            'usage_count' => 0,
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]), $codes);

        DB::table('icd10_codes')->insert($records);
    }
}
