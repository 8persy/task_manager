document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const apiUrl = 'http://localhost:3001/tasks';

    let tasks = [];

    // Функция для проверки доступности сервера
    async function checkServer() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Сервер недоступен');
            return true;
        } catch (error) {
            console.error('Ошибка при подключении к серверу:', error);
            alert('Сервер недоступен. Пожалуйста, запустите JSON Server.');
            return false;
        }
    }

    // Функция для загрузки задач с сервера
    async function fetchTasks() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Ошибка при загрузке задач');
            tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить задачи. Проверьте подключение к серверу.');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    // Функция для отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task');
            taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <p>Приоритет: ${task.priority}</p>
            <p>Срок выполнения: ${task.dueDate}</p>
            <p>Статус: ${task.status}</p>
            <div class="actions">
                <button class="edit">Редактировать</button>
                <button class="delete">Удалить</button>
                <button class="complete">${task.status === 'Завершено' ? 'Возобновить' : 'Завершить'}</button>
            </div>
        `;

            // Добавляем обработчики событий
            const editButton = taskElement.querySelector('.edit');
            const deleteButton = taskElement.querySelector('.delete');
            const completeButton = taskElement.querySelector('.complete');

            editButton.addEventListener('click', () => editTask(task.id));
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            completeButton.addEventListener('click', () => toggleStatus(task.id));

            taskList.appendChild(taskElement);
        });
    }

    // Функция для добавления задачи
    taskForm.addEventListener('submit', async (e) => {
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

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTask)
                });
                if (!response.ok) throw new Error('Ошибка при добавлении задачи');
                fetchTasks(); // Перезагружаем задачи
                taskForm.reset();
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось добавить задачу. Проверьте подключение к серверу.');
            }
        } else {
            alert('Пожалуйста, заполните все обязательные поля.');
        }
    });

    // Функция для редактирования задачи
    window.editTask = async (taskId) => {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-due-date').value = task.dueDate;

        // Удаляем задачу после редактирования
        await deleteTask(taskId);
    };

    // Функция для удаления задачи
    window.deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка при удалении задачи');
            fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось удалить задачу. Проверьте подключение к серверу.');
        }
    };

    // Функция для изменения статуса задачи
    window.toggleStatus = async (taskId) => {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'В процессе' ? 'Завершено' : 'В процессе';

        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({status: newStatus})
            });
            if (!response.ok) throw new Error('Ошибка при изменении статуса задачи');

            // Обновляем задачу в локальном массиве
            task.status = newStatus;

            // Перерисовываем задачи
            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось изменить статус задачи. Проверьте подключение к серверу.');
        }
    };

    // Функция для применения фильтров
    window.applyFilters = () => {
        const statusFilter = document.getElementById('filter-status').value;
        const priorityFilter = document.getElementById('filter-priority').value;
        const dueDateFilter = document.getElementById('filter-due-date').value;

        let filteredTasks = tasks;

        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        if (dueDateFilter) {
            filteredTasks = filteredTasks.filter(task => task.dueDate === dueDateFilter);
        }

        renderTasks(filteredTasks);
    };

    // Проверка сервера и загрузка задач
    checkServer().then(isServerAvailable => {
        if (isServerAvailable) {
            fetchTasks();
        }
    });
});