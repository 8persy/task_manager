document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.querySelector('.form__task-form');
    const taskList = document.querySelector('.task-list');
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
            document.querySelector('.loading').style.display = 'none';
        }
    }

    // Функция для отображения задач
    // Функция для отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-list__task');
            if (task.isEditing) {
                taskElement.classList.add('editing'); // Добавляем класс для режима редактирования
            }
            taskElement.setAttribute('data-id', task.id);

            if (task.isEditing) {
                // Режим редактирования
                taskElement.innerHTML = `
                <input type="text" class="task-list__edit-title" value="${task.title}" placeholder="Название задачи">
                <textarea class="task-list__edit-description" placeholder="Описание задачи">${task.description}</textarea>
                <select class="task-list__edit-priority">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Средний</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                </select>
                <input class="task-list__edit-date" type="date" value="${task.dueDate}">
                <div class="task-list__edit-actions">
                    <button class="task-list__edit-actions_save">Сохранить</button>
                    <button class="task-list__edit-actions_cancel">Отмена</button>
                </div>
            `;
            } else {
                // Режим просмотра
                taskElement.innerHTML = `
                <h3 class="task-list__task-title">${task.title}</h3>
                <p class="task-list__task-description">${task.description}</p>
                <p class="task-list__task-priority">Приоритет: ${task.priority}</p>
                <p class="task-list__task-date">Срок выполнения: ${task.dueDate}</p>
                <p class="task-list__task-status">Статус: ${task.status}</p>
                <div class="task-list__task-actions">
                    <button class="task-list__task-actions_edit">Редактировать</button>
                    <button class="task-list__task-actions_delete">Удалить</button>
                    <button class="task-list__task-actions_complete">${task.status === 'Завершено' ? 'Возобновить' : 'Завершить'}</button>
                </div>
            `;
            }

            // Добавляем обработчики событий
            if (task.isEditing) {
                const saveButton = taskElement.querySelector('.task-list__edit-actions_save');
                const cancelButton = taskElement.querySelector('.task-list__edit-actions_cancel');

                saveButton.addEventListener('click', () => saveTask(task.id));
                cancelButton.addEventListener('click', () => cancelEdit(task.id));
            } else {
                const editButton = taskElement.querySelector('.task-list__task-actions_edit');
                const deleteButton = taskElement.querySelector('.task-list__task-actions_delete');
                const completeButton = taskElement.querySelector('.task-list__task-actions_complete');

                editButton.addEventListener('click', () => startEdit(task.id));
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                completeButton.addEventListener('click', () => toggleStatus(task.id));
            }

            taskList.prepend(taskElement);
        });
    }

    // Функция для начала редактирования задачи
    function startEdit(taskId) {
        tasks = tasks.map(task => ({
            ...task,
            isEditing: task.id === taskId ? true : false
        }));
        renderTasks(tasks);
    }

    // Функция для сохранения изменений
    async function saveTask(taskId) {
        const taskElement = document.querySelector(`.task-list__task[data-id="${taskId}"]`);
        const title = taskElement.querySelector('.task-list__edit-title').value;
        const description = taskElement.querySelector('.task-list__edit-description').value;
        const priority = taskElement.querySelector('.task-list__edit-priority').value;
        const dueDate = taskElement.querySelector('.task-list__edit-date').value;

        const updatedTask = {
            title,
            description,
            priority,
            dueDate
        };

        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });
            if (!response.ok) throw new Error('Ошибка при сохранении задачи');

            tasks = tasks.map(task => ({
                ...task,
                isEditing: false
            }));
            await fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось сохранить задачу. Проверьте подключение к серверу.');
        }
    }

    // Функция для отмены редактирования
    function cancelEdit(taskId) {
        tasks = tasks.map(task => ({
            ...task,
            isEditing: false
        }));
        renderTasks(tasks);
    }

    // Функция для удаления задачи
    window.deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка при удалении задачи');
            await fetchTasks(); // Перезагружаем задачи
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

    window.applyFilters = () => {
        const statusFilter = document.querySelector('.form__filter-status').value;
        const priorityFilter = document.querySelector('.form__filter-priority').value;
        const dueDateFilter = document.querySelector('.form__filter-date').value;

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

    // Функция для добавления задачи
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.querySelector('.form__task-title').value;
        const description = document.querySelector('.form__task-description').value;
        const priority = document.querySelector('.form__task-priority').value;
        const dueDate = document.querySelector('.form__task-date').value;
        console.log(`t: ${title}, d: ${dueDate}`)

        if (title && dueDate) {
            const newTask = {
                title,
                description,
                priority,
                dueDate,
                status: 'В процессе',
                isEditing: false
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
                await fetchTasks(); // Перезагружаем задачи
                taskForm.reset();
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось добавить задачу. Проверьте подключение к серверу.');
            }
        } else {
            alert('Пожалуйста, заполните все обязательные поля.');
        }
    });

    // Проверка сервера и загрузка задач
    checkServer().then(isServerAvailable => {
        if (isServerAvailable) {
            fetchTasks();
        }
    });
});