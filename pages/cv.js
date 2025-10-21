import CVDownloadButton from '../components/CVDownloadButton';

export default function CVPage() {
  return (
    <div className="page-container cv-page">
      <CVDownloadButton />
      <div className="cv-header">
        <h1>cv.name</h1>
        <h2>cv.title</h2>
        <div className="cv-contact">
          <span>cv.birthdate</span>
          <span>cv.location</span>
          <span>cv.phone</span>
          <span><a href="mailto:Ayanakadir@hotmail.com">Ayanakadir@hotmail.com</a></span>
          <span><a href="https://Linkedin.com/in/kadirayana" target="_blank" rel="noopener noreferrer">linkedin.com/in/kadirayana</a></span>
        </div>
      </div>
      <div className="cv-summary">
        <p>cv.summary</p>
      </div>
      <div className="cv-section">
        <h3>cv.workExperience</h3>
        {/* TotalEnergies */}
        <div className="cv-job">
          <div className="cv-job-title">cv.jobs.totalEnergies.title <span>| cv.jobs.totalEnergies.role</span></div>
          <div className="cv-job-date">cv.jobs.totalEnergies.date</div>
          <ul>
            <li>cv.jobs.totalEnergies.desc1</li>
            <li>cv.jobs.totalEnergies.desc2</li>
            <li>cv.jobs.totalEnergies.desc3</li>
            <li>cv.jobs.totalEnergies.desc4</li>
          </ul>
        </div>
        {/* Alpkim Adhesives */}
        <div className="cv-job">
          <div className="cv-job-title">cv.jobs.alpkim.title <span>| cv.jobs.alpkim.role</span></div>
          <div className="cv-job-date">cv.jobs.alpkim.date</div>
          <ul>
            <li>cv.jobs.alpkim.desc1</li>
            <li>cv.jobs.alpkim.desc2</li>
          </ul>
        </div>
        {/* Kanat Paints and Coatings - R&D Engineer */}
        <div className="cv-job">
          <div className="cv-job-title">cv.jobs.kanatRD.title <span>| cv.jobs.kanatRD.role</span></div>
          <div className="cv-job-date">cv.jobs.kanatRD.date</div>
          <ul>
            <li>cv.jobs.kanatRD.desc1</li>
            <li>cv.jobs.kanatRD.desc2</li>
            <li>cv.jobs.kanatRD.desc3</li>
            <li>cv.jobs.kanatRD.desc4</li>
          </ul>
        </div>
        {/* IMS Polymers */}
        <div className="cv-job">
          <div className="cv-job-title">cv.jobs.ims.title <span>| cv.jobs.ims.role</span></div>
          <div className="cv-job-date">cv.jobs.ims.date</div>
          <ul>
            <li>cv.jobs.ims.desc1</li>
            <li>cv.jobs.ims.desc2</li>
          </ul>
        </div>
      </div>
      <div className="cv-section">
        <h3>cv.education</h3>
        {/* Ege University - Master's */}
        <div className="cv-edu">
          <div className="cv-edu-title">cv.edu.masters.title <span>| cv.edu.masters.program</span></div>
          <div className="cv-edu-date">cv.edu.masters.date</div>
          <ul>
            <li>cv.edu.masters.courses</li>
          </ul>
        </div>
        {/* Ege University - Bachelor's */}
        <div className="cv-edu">
          <div className="cv-edu-title">cv.edu.bachelors.title <span>| cv.edu.bachelors.program</span></div>
          <div className="cv-edu-date">cv.edu.bachelors.date</div>
          <ul>
            <li>cv.edu.bachelors.courses</li>
          </ul>
        </div>
      </div>
      <div className="cv-section-break">
        <div className="cv-grid-2">
          <div className="cv-section">
            <h3>cv.skills</h3>
            <div className="cv-skills-body">
              <div><strong>cv.skillsTurkish</strong></div>
              <div><strong>cv.skillsEnglish</strong></div>
              <div><strong>cv.skillsGerman</strong></div>
            </div>
          </div>
          <div className="cv-section">
            <h3>cv.skillsTechnical</h3>
            <div className="cv-skills-body">
              <div><strong>Programming:</strong> Python (NumPy, Pandas, Matplotlib, Scikit-learn), MATLAB, AutoCAD</div>
              <div><strong>Data Analysis:</strong> Statistical Analysis (Minitab), Regression Analysis, Data Visualization</div>
              <div><strong>Machine Learning:</strong> Scikit-learn, TensorFlow basics, Classification & Regression Models</div>
              <div><strong>ChemE Tools:</strong> Process Design & Modeling, ASPEN, Reaction Kinetics, Thermodynamic Simulations</div>
              <div><strong>Quality & Standards:</strong> ASTM Testing, ISO Compliance, GMP Protocols, FDA Requirements</div>
              <div><strong>Software:</strong> SolidWorks (3D CAD), Microsoft Office, Git/GitHub</div>
            </div>
          </div>
        </div>
      </div>
  <div className="cv-grid-2">
        <div className="cv-section">
          <h3>cv.certifications</h3>
          <ul className="cv-certs">
            <li>cv.certs.simulink</li>
            <li>cv.certs.matlab</li>
            <li>cv.certs.aromResearch</li>
            <li>cv.certs.aromZero</li>
            <li>cv.certs.researchTech</li>
            <li>cv.certs.projectWriting</li>
            <li>cv.certs.python</li>
            <li>cv.certs.academicWriting</li>
            <li>cv.certs.firstAid</li>
            <li>cv.certs.aiMl</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>cv.projects</h3>
          <ul className="cv-projects">
            <li>cv.projects1</li>
            <li>cv.projects2</li>
            <li>cv.projects3</li>
            <li>cv.projects4</li>
            <li>cv.projects5</li>
            <li>cv.projects6</li>
            <li>cv.projects7</li>
            <li>cv.projects8</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
