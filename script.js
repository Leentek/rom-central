document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    
    // Load theme from local storage
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-theme");
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
    });

    // Maintain theme across multiple pages
    const links = document.querySelectorAll("nav a");
    links.forEach(link => {
        link.addEventListener("click", (event) => {
            if (localStorage.getItem("theme") === "dark") {
                document.body.classList.add("dark-theme");
            }
        });
    });
});
