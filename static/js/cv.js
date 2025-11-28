class CVTimeline {
  constructor() {
    this.cvData = null;
    this.modal = document.getElementById('cvModal');
    this.timeline = document.getElementById('cvTimeline');
    this.closeBtn = document.getElementById('cvCloseBtn');
    this.cvButton = document.getElementById('cvButton');

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadCVData();
  }

  setupEventListeners() {
    // Open modal
    this.cvButton.addEventListener('click', () => {
      this.openModal();
    });

    // Close modal
    this.closeBtn.addEventListener('click', () => {
      this.closeModal();
    });

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        this.closeModal();
      }
    });
  }

  async loadCVData() {
    try {
      const response = await fetch('/cv/cv.yaml');
      if (!response.ok) {
        throw new Error('Failed to load CV data');
      }
      const yamlText = await response.text();
      this.cvData = jsyaml.load(yamlText);

      // Flatten the data for timeline rendering
      this.timelineItems = [];

      // Process education
      if (this.cvData.education) {
        this.cvData.education.forEach(item => {
          this.timelineItems.push({
            type: 'education',
            institution: item.institution,
            role: item.degree,
            start_date: item.start_date,
            end_date: item.end_date,
            current: item.current,
            logo: item.logo,
            summary: item.summary,
            achievements: item.details || []
          });
        });
      }


      // Process experience (companies with multiple roles)
      if (this.cvData.experience) {
        this.cvData.experience.forEach(company => {
          if (company.roles && Array.isArray(company.roles) && company.roles.length > 1) {
            // Group multiple roles for the same company
            const sortedRoles = company.roles.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            const latestRole = sortedRoles[0];
            const otherRoles = sortedRoles.slice(1);
            
            // Find the earliest start date across all roles
            const earliestStartDate = company.roles.reduce((earliest, role) => {
              const roleDate = new Date(role.start_date);
              const earliestDate = new Date(earliest);
              return roleDate < earliestDate ? role.start_date : earliest;
            }, company.roles[0].start_date);

            this.timelineItems.push({
              type: 'experience',
              company: company.company,
              role: latestRole.role,
              start_date: earliestStartDate,
              end_date: latestRole.end_date,
              current: latestRole.current,
              logo: company.logo,
              summary: latestRole.summary,
              achievements: latestRole.achievements || [],
              hasMultipleRoles: true,
              allRoles: sortedRoles
            });
          } else if (company.roles && Array.isArray(company.roles) && company.roles.length === 1) {
            // Single role
            const role = company.roles[0];
            this.timelineItems.push({
              type: 'experience',
              company: company.company,
              role: role.role,
              start_date: role.start_date,
              end_date: role.end_date,
              current: role.current,
              logo: company.logo,
              summary: role.summary,
              achievements: role.achievements || []
            });
          }
        });
      }

      // Sort by date (most recent first)
      this.timelineItems.sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateB - dateA;
      });

      this.renderTimeline();
    } catch (error) {
      console.error('Error loading CV data:', error);
    }
  }


  renderTimeline() {
    if (!this.timelineItems) return;

    let timelineHTML = '';

    // Add Education section with years
    const educationItems = this.timelineItems.filter(item => item.type === 'education');
    if (educationItems.length > 0) {
      timelineHTML += '<div class="cv-section-header"><span class="cv-section-icon">🎓</span> Education</div>';
      timelineHTML += '<div class="cv-section-content cv-education-section">';

      // Sort education items by start date (most recent first)
      const sortedEducation = educationItems.sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateB - dateA;
      });

      sortedEducation.forEach((item, index) => {
        const globalIndex = this.timelineItems.indexOf(item);
        timelineHTML += this.createTimelineItem(item, globalIndex);
      });

      timelineHTML += '</div>';
    }

    // Add Experience section with timeline
    const experienceItems = this.timelineItems.filter(item => item.type === 'experience');
    if (experienceItems.length > 0) {
      timelineHTML += '<div class="cv-section-header"><span class="cv-section-icon">💼</span> Experience</div>';
      timelineHTML += '<div class="cv-section-content cv-experience-section">';

      // Sort items by start date (most recent first)
      const sortedItems = experienceItems.sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateB - dateA;
      });

      sortedItems.forEach((item, index) => {
        const globalIndex = this.timelineItems.indexOf(item);
        timelineHTML += this.createTimelineItem(item, globalIndex);
      });

      timelineHTML += '</div>';
    }

    this.timeline.innerHTML = timelineHTML;
  }

  createTimelineItem(item, index) {
    const isEducation = item.type === 'education';
    const color = isEducation ? 'education' : 'experience';
    const institution = item.company || item.institution || 'Unknown';
    const role = item.role || item.degree || 'Unknown Position';

    // Format dates with months
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Present';
      // Parse YYYY-MM format directly to avoid timezone issues
      const parts = dateStr.split('-');
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1; // Convert to 0-indexed
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[monthIndex];
      return `${month} ${year}`;
    };

    const startDate = formatDate(item.start_date);
    const endDate = formatDate(item.end_date);
    const endDateDisplay = (item.end_date && item.current) ? `${endDate} (expected)` : endDate;

    return `
      <div class="cv-timeline-item ${color}" data-index="${index}">
        <div class="cv-item-container">
          ${item.logo ? (item.logo.includes('http') || item.logo.startsWith('/') ? `<img src="${item.logo}" alt="${institution} logo" class="cv-company-logo">` : `<div class="cv-company-logo cv-emoji-logo">${item.logo}</div>`) : ''}
          <div class="cv-item-content">
            <div class="cv-item-header">
              <h3 class="cv-institution">${role}${item.hasMultipleRoles ? ` (+${item.allRoles.length - 1} more role${item.allRoles.length - 1 > 1 ? 's' : ''})` : ''}</h3>
              <span class="cv-latest-role">${institution}</span>
              <span class="cv-date-range">${startDate} - ${endDateDisplay}</span>
            </div>
            <div class="cv-summary">
              <p>${item.summary || 'No summary available'}</p>
            </div>
            <div class="cv-details" style="display: none;">
              <div class="cv-achievements">
                <h4>Details</h4>
                ${item.hasMultipleRoles ? `
                  ${item.allRoles.map((role, idx) => {
                    const roleEndDate = formatDate(role.end_date);
                    const roleEndDateDisplay = (role.end_date && role.current) ? `${roleEndDate} (expected)` : roleEndDate;
                    return `
                    <div class="cv-role-detail-section">
                      <h5>${role.role} (${formatDate(role.start_date)} - ${roleEndDateDisplay})</h5>
                      ${role.achievements && role.achievements.length > 0 ? `
                        <ul class="cv-role-achievements">
                          ${role.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  `}).join('')}
                ` : `
                  <ul>
                    ${(item.achievements || item.details || []).map(achievement =>
                      `<li>${achievement}</li>`
                    ).join('')}
                  </ul>
                  ${item.previous_roles ? `
                    <h4>Previous Roles at ${item.company}</h4>
                    <ul>
                      ${item.previous_roles.map(role => `<li>${role}</li>`).join('')}
                    </ul>
                  ` : ''}
                `}
              </div>
            </div>
            <div class="cv-expand-btn" onclick="cvTimeline.toggleDetails(${index})">${item.hasMultipleRoles ? 'Show All Roles' : 'Show Details'} ▼</div>
          </div>
        </div>
      </div>
    `;
  }

  toggleDetails(index) {
    const item = document.querySelector(`.cv-timeline-item[data-index="${index}"]`);
    const details = item.querySelector('.cv-details');
    const arrow = item.querySelector('.cv-arrow');

    if (details.style.display === 'none') {
      details.style.display = 'block';
      item.classList.add('expanded');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
      details.style.display = 'none';
      item.classList.remove('expanded');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
  }

  openModal() {
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeModal() {
    this.modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
}

// Initialize CV timeline when DOM is loaded
let cvTimeline;
document.addEventListener('DOMContentLoaded', () => {
  cvTimeline = new CVTimeline();
});
