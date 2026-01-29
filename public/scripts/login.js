document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username-input');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const username = usernameInput.value.trim();
        
        if (username !== '') {
            let usernames = JSON.parse(localStorage.getItem('usernames')) || [];
            
            if (!usernames.includes(username)) {
                usernames.push(username);
                localStorage.setItem('usernames', JSON.stringify(usernames));
            }
            
            localStorage.setItem('currentUser', JSON.stringify({
                username: username,
                joinedAt: new Date().toISOString()
            }));
            
            window.location.href = './chat-page.html'; // Redirect to the main(chat) page
        }
    });
});
