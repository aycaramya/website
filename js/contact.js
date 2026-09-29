/* email link built at runtime from split data-attributes so a plain
   HTML/regex scraper never sees a full address in the page source */
document.querySelectorAll('.js-email').forEach(function (a) {
  var user = a.getAttribute('data-user');
  var domain = a.getAttribute('data-domain');
  a.href = 'mailto:' + user + '@' + domain;
});

/* contact form — submits via fetch so the page never redirects to
   the form backend, and a bot that skips JS execution never sees
   a working submit path at all */
var contactForm = document.getElementById('contact-form');
if (contactForm) {
  var contactStatus = document.getElementById('contact-status');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (contactForm.elements['_gotcha'].value) return; // honeypot tripped

    var submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    contactStatus.textContent = 'sending...';
    contactStatus.className = '';

    fetch(contactForm.action, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        contactForm.reset();
        contactStatus.textContent = "sent! I'll get back to you soon.";
        contactStatus.className = 'ok';
      } else {
        contactStatus.textContent = 'something went wrong — try the email link below instead.';
        contactStatus.className = 'err';
      }
    }).catch(function () {
      contactStatus.textContent = 'something went wrong — try the email link below instead.';
      contactStatus.className = 'err';
    }).finally(function () {
      submitBtn.disabled = false;
    });
  });
}
