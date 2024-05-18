

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#compose-form').onsubmit = function(){
      let recipients = document.querySelector('#compose-recipients').value;
      let subject = document.querySelector('#compose-subject').value;
      let body = document.querySelector('#compose-body').value;

      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
      })
      .then(response => response.json())
      .then(result => {
        if (result.message) {
          alert(result.message);
          load_mailbox('sent');
      } else if (result.error) {
          alert(result.error);
      }
      });

        return false;
      };

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then (emails => {
    document.querySelector('#emails-view').innerHTML = '';
    emails.forEach(email => {
      const element = document.createElement('div');
      element.className = 'email';
      element.innerHTML = `${email.sender}: ${email.subject} (${email.timestamp})`;
      if (email.read) {
        element.style.backgroundColor = 'gray';
      } else {
        element.style.backgroundColor = 'white';
      }
      element.addEventListener('click', function() {
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
          document.querySelector('#emails-view').innerHTML = ''; 
          const element = document.createElement('div');
          element.className = 'email';
          element.innerHTML = `From: ${email.sender}<br>To: ${email.recipients.join(', ')}<br>Subject: ${email.subject}<br>Timestamp: ${email.timestamp}<br><br>${email.body}`;
          const replyButton = document.createElement('button');
          replyButton.textContent = 'Reply';
          replyButton.addEventListener('click', function() {
            document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'block';
          document.querySelector('#compose-recipients').value = email.sender;
            document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
            document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n`;
          });
          document.querySelector('#emails-view').append(replyButton);

          const archiveButton = document.createElement('button');
            if (email.archived) {
              archiveButton.textContent = 'Unarchive';
            } else {
              archiveButton.textContent = 'Archive';
            }
            archiveButton.addEventListener('click', function() {
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: !email.archived
                })
              })
              .then(() => {
                load_mailbox('inbox');
              });
            });
            document.querySelector('#emails-view').append(archiveButton);
          document.querySelector('#emails-view').append(element);
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          });
        });
      });
      document.querySelector('#emails-view').append(element);
    });
  });
}