// omprosjekt.js — small interactive enhancements: reveal-on-scroll and stat counters
(function () {
  'use strict';

  // Reveal on scroll using IntersectionObserver
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // optionally unobserve to avoid repeated triggers
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => obs.observe(el));
  }

  // Animated stat counters
  const counters = document.querySelectorAll('.stat-value[data-target]');
  counters.forEach(el => {
    const target = Number(el.getAttribute('data-target')) || 0;
    // if the text already contains units like "~800 t", keep that text but animate the number part
    const unit = (el.textContent || '').replace(/[0-9\s.,~kKmMtT]+/g, '').trim();

    let start = 0;
    const duration = 1400; // ms
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(progress * target);
      el.textContent = value.toLocaleString() + (unit ? ' ' + unit : ' t');
      if (progress < 1) requestAnimationFrame(step);
    }

    // start counting when element becomes visible
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(step);
          cObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    cObs.observe(el);
  });
})();

// Load and render Jira tasks if `data/jira.json` is present and an element with id `jira-tasks` exists
(function loadJiraTasks() {
  const container = document.getElementById('jira-tasks');
  if (!container) return; // nothing to do

  fetch('./data/jira.json', { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error('Jira data not found');
      return res.json();
    })
    .then(data => {
      const issues = (data && data.issues) || [];
      if (!issues.length) {
        container.innerHTML = '<p>No tasks available.</p>';
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'jira-task-list';

      issues.forEach(issue => {
        const li = document.createElement('li');
        li.className = 'jira-task';
        const a = document.createElement('a');
        a.href = issue.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `${issue.key}: ${issue.summary}`;

        const meta = document.createElement('span');
        meta.className = 'jira-meta';
        meta.textContent = issue.status ? ` — ${issue.status}` : '';

        li.appendChild(a);
        li.appendChild(meta);
        ul.appendChild(li);
      });

      container.innerHTML = '';
      container.appendChild(ul);
    })
    .catch(err => {
      console.error('Error loading Jira tasks:', err);
      container.innerHTML = '<p>Error loading tasks.</p>';
    });
})();
