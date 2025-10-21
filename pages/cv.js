import CVDownloadButton from '../components/CVDownloadButton';

export default function CVPage() {
  return (
    <div className="page-container cv-page">
      <CVDownloadButton />
      <div className="cv-header">
        <h1>Kadir AYANA</h1>
        <h2>Chemical Engineer & Researcher | R&D | Process Development</h2>
        <div className="cv-contact">
          <span>📅 Date of Birth: 1998</span>
          <span>📍 Location: Izmir, Turkey</span>
          <span>📞 Phone: +90 536 943 39 43</span>
          <span>✉️ <a href="mailto:Ayanakadir@hotmail.com">Ayanakadir@hotmail.com</a></span>
          <span>🔗 <a href="https://Linkedin.com/in/kadirayana" target="_blank" rel="noopener noreferrer">linkedin.com/in/kadirayana</a></span>
        </div>
      </div>
      <div className="cv-summary">
        <p>Purposeful Chemical Engineer with expertise in R&D, process optimization, and quality control. Proven history in formulation development, laboratory testing (ASTM), and team leadership. Strong technical skills: process engineering, reaction kinetics, thermodynamics, MATLAB, Python. Seeking opportunities in process development, product innovation, or research engineering.</p>
      </div>
      <div className="cv-section">
        <h3>Work Experience</h3>
        <div className="cv-job">
          <div className="cv-job-title">Total Energies <span>| Laboratory Engineer | Quality Control & Testing</span></div>
          <div className="cv-job-date">April 2025 - July 2025</div>
          <ul>
            <li>Executed ASTM-compliant QC testing; ensured raw material & product specifications compliance.</li>
            <li>Managed laboratory equipment maintenance; calibrated analytical instruments.</li>
            <li>Documented test results; collaborated cross-functionally for continuous improvement.</li>
            <li>Enforced HSE protocols; maintained 100% safety compliance.</li>
          </ul>
        </div>
        <div className="cv-job">
          <div className="cv-job-title">Alpkim Adhesives <span>| Sales Representative | Technical Account Management</span></div>
          <div className="cv-job-date">January 2025 - April 2025</div>
          <ul>
            <li>Exceeded sales targets; delivered technical presentations & built strategic customer partnerships.</li>
            <li>Managed CRM pipeline & tracked performance metrics.</li>
          </ul>
        </div>
        <div className="cv-job">
          <div className="cv-job-title">Kanat Paints and Coatings <span>| R&D Engineer | Formulation Development & Testing</span></div>
          <div className="cv-job-date">June 2023 - August 2024</div>
          <ul>
            <li>Conducted laboratory testing; validated paint formulations vs. ISO/ASTM standards.</li>
            <li>Co-authored TUBITAK 1505 grant project; developed innovative water-based coating solutions.</li>
            <li>Led 15+ formulation projects; achieved 3 successful product launches with zero defects; mentored 4 junior researchers.</li>
            <li>Temporarily managed R&D Waterborne Paints division (3 months); optimized workflows resulting in 25% faster project delivery; received recognition for excellence.</li>
          </ul>
        </div>
        <div className="cv-job">
          <div className="cv-job-title">IMS Polymers <span>| Process Engineering Intern | Production Optimization</span></div>
          <div className="cv-job-date">August - September 2022</div>
          <ul>
            <li>Analyzed production workflows; identified efficiency improvement opportunities.</li>
            <li>Supported inventory tracking and processing documentation.</li>
          </ul>
        </div>
      </div>
      <div className="cv-section">
        <h3>Education</h3>
        <div className="cv-edu">
          <div className="cv-edu-title">Ege University <span>| M.Sc. Chemical Engineering</span></div>
          <div className="cv-edu-date">September 2023 - June 2026 (Expected)</div>
          <ul>
            <li>Solid Waste Recycling, Catalyst Deactivation, Statistical Methods in Experimental Design, Engineering Thermoplastics, Applied Engineering Mathematics, and Minitab</li>
          </ul>
        </div>
        <div className="cv-edu">
          <div className="cv-edu-title">Ege University <span>| B.Sc. Chemical Engineering</span></div>
          <div className="cv-edu-date">September 2017 - July 2023</div>
          <ul>
            <li>Process Control, Chemical Engineering Design, Mass Transfer, Heat Transfer, Thermodynamics, Reaction Engineering, MATLAB, AutoCAD, Polymath, MS Office</li>
          </ul>
        </div>
      </div>
      <div className="cv-section-break">
        <div className="cv-grid-2">
          <div className="cv-section">
            <h3>Languages</h3>
            <div className="cv-skills-body">
              <div><strong>TR Turkish - Native</strong></div>
              <div><strong>EN English - Fluent</strong></div>
              <div><strong>DE German - Beginner</strong></div>
            </div>
          </div>
          <div className="cv-section">
            <h3>Technical Skills</h3>
            <div className="cv-skills-body">
              <div><strong>Programming:</strong> Python (NumPy, Pandas, Matplotlib, Scikit-learn), MATLAB, AutoCAD</div>
              <div><strong>Data Analysis:</strong> Statistical Analysis (Minitab), Regression Analysis, Data Visualization</div>
              <div><strong>Machine Learning:</strong> Scikit-learn, TensorFlow basics, Classification & Regression Models</div>
              <div><strong>ChemE Tools:</strong> Process Design & Modeling, ASPEN, Reaction Kinetics, Thermodynamic Simulations</div>
              <div><strong>Quality & Standards:</strong> ASTM Testing, ISO Compliance, GMP Protocols</div>
              <div><strong>Software:</strong> SolidWorks (3D CAD), Microsoft Office, Git/GitHub</div>
            </div>
          </div>
        </div>
      </div>
  <div className="cv-grid-2">
        <div className="cv-section">
          <h3>Professional Certification & Training</h3>
          <ul className="cv-certs">
            <li>MATLAB Simulink Onramp</li>
            <li>AROM ARAŞTIRMACI ÖĞRENCİ (Researcher Student)</li>
            <li>AROM SIFIR ATIK VE UYGULAMALARI (Zero Waste and Processing)</li>
            <li>RESEARCH TECHNIQUES TRAINING</li>
            <li>PROJECT WRITING TRAINING CERTIFICATE PROGRAM</li>
            <li>PYTHON EDUCATION CERTIFICATE PROGRAM</li>
            <li>BASIC ACADEMIC WRITING SKILLS</li>
            <li>BASIC FIRST AID TRAINING</li>
            <li>ARTIFICIAL INTELLIGENCE BASED MACHINE LEARNING AND BASIC ALGORITHMS TRAINING</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Notable Projects & Achievements</h3>
          <ul className="cv-projects">
            <li>Development of water-based paint providing thermal insulation for military vehicles (Kanat Paints and Coatings)</li>
            <li>Development of high chemical resistance water-based paint that can adhere to aircraft cabin plastic parts (Kanat Paints and Coatings)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
