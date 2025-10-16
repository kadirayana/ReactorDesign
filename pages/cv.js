
import { useTranslation } from 'next-i18next';

export default function CVPage() {
  const { t } = useTranslation();
  return (
    <div className="page-container cv-page">
      <div className="cv-header">
        <h1>{t('cv.name')}</h1>
        <h2>{t('cv.title')}</h2>
        <div className="cv-contact">
          <span>{t('cv.birthdate')}</span>
          <span>{t('cv.location')}</span>
          <span>{t('cv.phone')}</span>
          <span><a href="mailto:Ayanakadir@hotmail.com">Ayanakadir@hotmail.com</a></span>
          <span><a href="https://Linkedin.com/in/kadirayana" target="_blank" rel="noopener noreferrer">linkedin.com/in/kadirayana</a></span>
        </div>
      </div>
      <div className="cv-summary">
        <p>{t('cv.summary')}</p>
      </div>
      <div className="cv-section">
        <h3>{t('cv.workExperience')}</h3>
        {/* TotalEnergies */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.totalEnergies.title')} <span>| {t('cv.jobs.totalEnergies.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.totalEnergies.date')}</div>
          <ul>
            <li>{t('cv.jobs.totalEnergies.desc1')}</li>
            <li>{t('cv.jobs.totalEnergies.desc2')}</li>
            <li>{t('cv.jobs.totalEnergies.desc3')}</li>
            <li>{t('cv.jobs.totalEnergies.desc4')}</li>
          </ul>
        </div>
        {/* Alpkim Adhesives */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.alpkim.title')} <span>| {t('cv.jobs.alpkim.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.alpkim.date')}</div>
          <ul>
            <li>{t('cv.jobs.alpkim.desc1')}</li>
            <li>{t('cv.jobs.alpkim.desc2')}</li>
            <li>{t('cv.jobs.alpkim.desc3')}</li>
            <li>{t('cv.jobs.alpkim.desc4')}</li>
          </ul>
        </div>
        {/* Kanat Paints and Coatings - Executive Engineer */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.kanatExec.title')} <span>| {t('cv.jobs.kanatExec.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.kanatExec.date')}</div>
          <ul>
            <li>{t('cv.jobs.kanatExec.desc1')}</li>
          </ul>
        </div>
        {/* Kanat Paints and Coatings - R&D Engineer */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.kanatRD.title')} <span>| {t('cv.jobs.kanatRD.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.kanatRD.date')}</div>
          <ul>
            <li>{t('cv.jobs.kanatRD.desc1')}</li>
            <li>{t('cv.jobs.kanatRD.desc2')}</li>
          </ul>
        </div>
        {/* IMS Polymers */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.ims.title')} <span>| {t('cv.jobs.ims.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.ims.date')}</div>
          <ul>
            <li>{t('cv.jobs.ims.desc1')}</li>
            <li>{t('cv.jobs.ims.desc2')}</li>
          </ul>
        </div>
        {/* Novartis Pharmaceuticals */}
        <div className="cv-job">
          <div className="cv-job-title">{t('cv.jobs.novartis.title')} <span>| {t('cv.jobs.novartis.role')}</span></div>
          <div className="cv-job-date">{t('cv.jobs.novartis.date')}</div>
          <ul>
            <li>{t('cv.jobs.novartis.desc1')}</li>
            <li>{t('cv.jobs.novartis.desc2')}</li>
          </ul>
        </div>
      </div>
      <div className="cv-section">
        <h3>{t('cv.education')}</h3>
        {/* Ege University - Master's */}
        <div className="cv-edu">
          <div className="cv-edu-title">{t('cv.edu.masters.title')} <span>| {t('cv.edu.masters.program')}</span></div>
          <div className="cv-edu-date">{t('cv.edu.masters.date')}</div>
          <ul>
            <li>{t('cv.edu.masters.courses')}</li>
          </ul>
        </div>
        {/* Ege University - Bachelor's */}
        <div className="cv-edu">
          <div className="cv-edu-title">{t('cv.edu.bachelors.title')} <span>| {t('cv.edu.bachelors.program')}</span></div>
          <div className="cv-edu-date">{t('cv.edu.bachelors.date')}</div>
          <ul>
            <li>{t('cv.edu.bachelors.courses')}</li>
          </ul>
        </div>
        {/* Şeyh Şamil High School */}
        <div className="cv-edu">
          <div className="cv-edu-title">{t('cv.edu.highschool.title')} <span>| {t('cv.edu.highschool.program')}</span></div>
          <div className="cv-edu-date">{t('cv.edu.highschool.date')}</div>
          <ul>
            <li>{t('cv.edu.highschool.award')}</li>
            <li>{t('cv.edu.highschool.honor')}</li>
            <li>{t('cv.edu.highschool.valedictorian')}</li>
            <li>{t('cv.edu.highschool.competitions')}</li>
          </ul>
        </div>
      </div>
      <div className="cv-section">
        <h3>{t('cv.skills')}</h3>
        <ul className="cv-skills">
          <li>{t('cv.skillsTurkish')}</li>
          <li>{t('cv.skillsEnglish')}</li>
          <li>{t('cv.skillsGerman')}</li>
          <li>{t('cv.skillsProject')}</li>
        </ul>
      </div>
      <div className="cv-section">
        <h3>{t('cv.certifications')}</h3>
        <ul className="cv-certs">
          <li>{t('cv.certs.simulink')}</li>
          <li>{t('cv.certs.matlab')}</li>
          <li>{t('cv.certs.aromResearch')}</li>
          <li>{t('cv.certs.aromZero')}</li>
          <li>{t('cv.certs.researchTech')}</li>
          <li>{t('cv.certs.projectWriting')}</li>
          <li>{t('cv.certs.python')}</li>
          <li>{t('cv.certs.academicWriting')}</li>
          <li>{t('cv.certs.firstAid')}</li>
          <li>{t('cv.certs.aiMl')}</li>
        </ul>
      </div>
      <div className="cv-section">
        <h3>{t('cv.projects')}</h3>
        <ul className="cv-projects">
          <li>{t('cv.projects1')}</li>
          <li>{t('cv.projects2')}</li>
          <li>{t('cv.projects3')}</li>
          <li>{t('cv.projects4')}</li>
          <li>{t('cv.projects5')}</li>
          <li>{t('cv.projects6')}</li>
          <li>{t('cv.projects7')}</li>
          <li>{t('cv.projects8')}</li>
        </ul>
      </div>
    </div>
  );
}
