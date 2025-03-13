document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');

    // Загрузка задач из Local Storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Функция для отображения задач
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task');
            taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Приоритет: ${task.priority}</p>
                <p>Срок выполнения: ${task.dueDate}</p>
                <div class="actions">
                    <button class="edit" onclick="editTask(${index})">Редактировать</button>
                    <button class="delete" onclick="deleteTask(${index})">Удалить</button>
                </div>
            `;
            taskList.appendChild(taskElement);
        });
    }

    // Функция для добавления задачи
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;

        if (title && dueDate) {
            const newTask = {
                title,
                description,
                priority,
                dueDate,
                status: 'В процессе'
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            taskForm.reset();
        } else {
            alert('Пожалуйста, заполните все обязательные поля.');
        }
    });

    // Функция для редактирования задачи
    window.editTask = (index) => {
        const task = tasks[index];
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-due-date').value = task.dueDate;

        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    };

    // Функция для удаления задачи
    window.deleteTask = (index) => {
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    };

    // Первоначальная загрузка задач
    renderTasks();
});