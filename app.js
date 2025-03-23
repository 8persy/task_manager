document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.querySelector('.form__task-form');
    const taskList = document.querySelector('.task-list');
    const apiUrl = 'http://localhost:3001/tasks';

    let tasks = [];

    // Ключ для Local Storage
    const localStorageKey = 'tasks';

    let editingTaskId = null;

    // Функция для генерации уникального ID
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Функция для загрузки задач из Local Storage
    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem(localStorageKey);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);

            tasks.forEach(task => {
                if (!task.id) {
                    task.id = generateUniqueId()
                }
            });
            renderTasks(tasks);
        }
    }

    // Функция для сохранения задач в Local Storage
    function saveTasksToLocalStorage() {
        const tasksToSave = tasks.map(task => ({
            id: task.id, // Сохраняем ID задачи
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            status: task.status,
            isEditing: task.isEditing
        }));
        localStorage.setItem(localStorageKey, JSON.stringify(tasksToSave));
    }

    // Функция для проверки доступности сервера
    async function checkServer() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Сервер недоступен');
            return true;
        } catch (error) {
            console.error('Ошибка при подключении к серверу:', error);
            loadTasksFromLocalStorage();
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
            saveTasksToLocalStorage();
        } catch (error) {
            console.error('Ошибка:', error);
            loadTasksFromLocalStorage();
        } finally {
            document.querySelector('.loading').style.display = 'none';
        }
    }

    // Функция для расчёта прогресса выполнения задач
    function calculateProgress(tasks) {
        const totalTasks = tasks.length;
        if (totalTasks === 0) return 0; // Если задач нет, прогресс 0%

        const completedTasks = tasks.filter(task => task.status === 'Завершено').length;
        return (completedTasks / totalTasks) * 100;
    }

    // Функция для обновления Progress Bar
    function updateProgress() {
        const progress = calculateProgress(tasks);
        const progressFill = document.querySelector('.progress__fill');
        const progressText = document.querySelector('.progress__text');

        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }

    // Функция для отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-list__task');

            if (task.id === editingTaskId) {
                taskElement.classList.add('editing');
            }

            taskElement.setAttribute('data-id', task.id);

            if (task.id === editingTaskId) {
                taskElement.innerHTML = '';

                let editTemplate = document.querySelector('#edit-template').content;
                let editElement = editTemplate.cloneNode(true);

                editElement.querySelector('.task-list__edit-title').value = task.title;
                editElement.querySelector('.task-list__edit-description').textContent = task.description;

                if (task.priority === 'low') {
                    editElement.querySelector('.task-list__edit-priority_value_low').setAttribute('selected', true);
                } else if (task.priority === 'medium') {
                    editElement.querySelector('.task-list__edit-priority_value_medium').setAttribute('selected', true);
                } else if (task.priority === 'high') {
                    editElement.querySelector('.task-list__edit-priority_value_high').setAttribute('selected', true);
                }

                editElement.querySelector('.task-list__edit-date').value = task.dueDate;

                taskElement.append(editElement);
            } else {
                taskElement.innerHTML = '';

                let taskTemplate = document.querySelector('#task-template').content;
                let taskTemplateElement = taskTemplate.cloneNode(true);

                taskTemplateElement.querySelector('.task-list__task-title').textContent = task.title;
                taskTemplateElement.querySelector('.task-list__task-description').textContent = task.description;
                taskTemplateElement.querySelector('.task-list__task-priority').textContent = task.priority;
                taskTemplateElement.querySelector('.task-list__task-date').textContent = task.dueDate;
                taskTemplateElement.querySelector('.task-list__task-status').textContent = task.status;

                if (task.status === 'Завершено') {
                    taskTemplateElement.querySelector('.task-list__task-actions_complete').textContent = 'Возобновить';
                } else {
                    taskTemplateElement.querySelector('.task-list__task-actions_complete').textContent = 'Завершить';
                }

                taskElement.append(taskTemplateElement);
            }

            if (task.id === editingTaskId) {
                const saveButton = taskElement.querySelector('.task-list__edit-actions_save');
                const cancelButton = taskElement.querySelector('.task-list__edit-actions_cancel');

                saveButton.addEventListener('click', () => saveTask(task.id));
                cancelButton.addEventListener('click', () => cancelEdit());
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
        document.querySelector('.loading').style.display = 'none';
        updateProgress()
    }

    // Функция для начала редактирования задачи
    function startEdit(taskId) {
        editingTaskId = taskId; //
        renderTasks(tasks);
    }

    // Функция для сохранения задачи
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

            editingTaskId = null;
            await fetchTasks();
        } catch (error) {
            console.error('Ошибка:', error);
            editingTaskId = null;

            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {...tasks[taskIndex], ...updatedTask};
                saveTasksToLocalStorage();
                renderTasks(tasks);
            }

            alert('Сервер недоступен. Изменения сохранены локально.');
        }
    }

    // Функция для отмены редактирования
    function cancelEdit() {
        editingTaskId = null;
        renderTasks(tasks);
    }

    // Функция для удаления задачи
    window.deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка при удалении задачи');
            await fetchTasks();
        } catch (error) {
            console.error('Ошибка:', error);

            tasks = tasks.filter(task => task.id !== taskId);
            saveTasksToLocalStorage();
            renderTasks(tasks);

            alert('Сервер недоступен. Задача удалена локально.');
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

            task.status = newStatus;

            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);

            task.status = newStatus;
            saveTasksToLocalStorage();
            renderTasks(tasks);

            alert('Сервер недоступен. Статус задачи изменён локально.');
        }
    };

    // Функция для применения фильтров
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

    // Функция для проверки даты
    function isValidDate(dateString) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate >= today;
    }

    // Функция для добавления задачи
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.querySelector('.form__task-title').value;
        const description = document.querySelector('.form__task-description').value;
        const priority = document.querySelector('.form__task-priority').value;
        const dueDate = document.querySelector('.form__task-date').value;

        if (!title || !dueDate) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        // Проверка даты
        if (!isValidDate(dueDate)) {
            alert('Срок выполнения должен быть датой в будущем.');
            return;
        }

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
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === 'Ошибка валидации') {
                    alert(`Ошибка валидации: ${errorData.details.map(d => d.message).join(', ')}`);
                } else {
                    throw new Error('Ошибка при добавлении задачи');
                }
            } else {
                const createdTask = await response.json();
                tasks.push(createdTask);
                saveTasksToLocalStorage();
                renderTasks(tasks);
                taskForm.reset();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            newTask.id = generateUniqueId();
            tasks.push(newTask);
            saveTasksToLocalStorage();
            renderTasks(tasks);
            alert('Сервер недоступен. Задача сохранена локально.');
        }
    });

    // Функция для синхронизации данных с сервером
    async function syncTasksWithServer() {
        const localTasks = JSON.parse(localStorage.getItem(localStorageKey)) || [];
        if (localTasks.length === 0) return;

        try {
            // Загружаем текущие задачи с сервера
            const serverTasksResponse = await fetch(apiUrl);
            if (!serverTasksResponse.ok) throw new Error('Ошибка при загрузке задач с сервера');
            const serverTasks = await serverTasksResponse.json();

            // Синхронизируем каждую задачу из Local Storage
            for (const localTask of localTasks) {
                const existingTask = serverTasks.find(task => task.title === localTask.title && task.dueDate === localTask.dueDate);

                if (existingTask) {
                    const response = await fetch(`${apiUrl}/${existingTask.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(localTask)
                    });

                    if (!response.ok) {
                        throw new Error('Ошибка при обновлении задачи');
                    }
                } else {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(localTask)
                    });

                    if (!response.ok) {
                        throw new Error('Ошибка при добавлении задачи');
                    }
                }
            }

            localStorage.removeItem(localStorageKey);
            fetchTasks();
        } catch (error) {
            console.error('Ошибка при синхронизации задач:', error);
        }
    }

    // Проверка сервера и загрузка задач
    checkServer().then(isServerAvailable => {
        if (isServerAvailable) {
            syncTasksWithServer();
            fetchTasks();
        }
    });
});