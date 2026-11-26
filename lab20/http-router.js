import http from 'node:http';

const PORT = 3000;
const GROUP = 'ББМО-01-23';

let students = [
    {
        id: 1,
        name: 'Иван',
        group: GROUP
    },
    {
        id: 2,
        name: 'Мария',
        group: GROUP
    }
];

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Powered-By': 'Node.js',
        'X-Group': 'BBMO-01-23',
        'Cache-Control': 'no-cache'
    });

    response.end(
        JSON.stringify(data, null, 2)
    );
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        request.on('data', chunk => {
            chunks.push(chunk);
        });

        request.on('end', () => {
            resolve(
                Buffer.concat(chunks).toString('utf8')
            );
        });

        request.on('error', reject);
    });
}

function getRoute(pathname, method) {
    // GET /api/students
    if (
        pathname === '/api/students' &&
        method === 'GET'
    ) {
        return {
            handler: 'getAll'
        };
    }

    // POST /api/students
    if (
        pathname === '/api/students' &&
        method === 'POST'
    ) {
        return {
            handler: 'create'
        };
    }

    // GET /api/students/:id
    const getStudentMatch =
        pathname.match(/^\/api\/students\/(\d+)$/);

    if (
        getStudentMatch &&
        method === 'GET'
    ) {
        return {
            handler: 'getOne',
            id: Number(getStudentMatch[1])
        };
    }

    // PUT /api/students/:id
    if (
        getStudentMatch &&
        method === 'PUT'
    ) {
        return {
            handler: 'update',
            id: Number(getStudentMatch[1])
        };
    }

    // DELETE /api/students/:id
    if (
        getStudentMatch &&
        method === 'DELETE'
    ) {
        return {
            handler: 'delete',
            id: Number(getStudentMatch[1])
        };
    }

    return null;
}

const server = http.createServer(async (request, response) => {
    const method = request.method;
    const fullUrl = new URL(
        request.url,
        `http://${request.headers.host || 'localhost'}`
    );

    const pathname = fullUrl.pathname;

    console.log(
        `[${new Date().toLocaleString('ru-RU')}] [${GROUP}] ${method} ${request.url}`
    );

    const route = getRoute(pathname, method);

    // ==========================================
    // GET /api/students
    // ==========================================

    if (
        route?.handler === 'getAll'
    ) {
        const groupFilter =
            fullUrl.searchParams.get('group');

        let result = students;

        if (groupFilter) {
            result = students.filter(
                student =>
                    student.group === groupFilter
            );
        }

        sendJson(
            response,
            200,
            result
        );

        return;
    }

    // ==========================================
    // GET /api/students/:id
    // ==========================================

    if (
        route?.handler === 'getOne'
    ) {
        const student =
            students.find(
                item => item.id === route.id
            );

        if (!student) {
            sendJson(
                response,
                404,
                {
                    error: 'Студент не найден'
                }
            );

            return;
        }

        sendJson(
            response,
            200,
            student
        );

        return;
    }

    // ==========================================
    // POST /api/students
    // ==========================================

    if (
        route?.handler === 'create'
    ) {
        try {
            const body =
                await readBody(request);

            const data =
                JSON.parse(body);

            if (!data.name) {
                sendJson(
                    response,
                    400,
                    {
                        error:
                            'Поле name обязательно'
                    }
                );

                return;
            }

            const newId =
                students.length > 0
                    ? Math.max(
                        ...students.map(
                            student => student.id
                        )
                    ) + 1
                    : 1;

            const newStudent = {
                id: newId,
                name: data.name,
                group: data.group || GROUP
            };

            students.push(newStudent);

            sendJson(
                response,
                201,
                newStudent
            );

        } catch {
            sendJson(
                response,
                400,
                {
                    error: 'Некорректный JSON'
                }
            );
        }

        return;
    }

    // ==========================================
    // PUT /api/students/:id
    // ==========================================

    if (
        route?.handler === 'update'
    ) {
        try {
            const student =
                students.find(
                    item => item.id === route.id
                );

            if (!student) {
                sendJson(
                    response,
                    404,
                    {
                        error: 'Студент не найден'
                    }
                );

                return;
            }

            const body =
                await readBody(request);

            const data =
                JSON.parse(body);

            if (data.name) {
                student.name = data.name;
            }

            if (data.group) {
                student.group = data.group;
            }

            sendJson(
                response,
                200,
                student
            );

        } catch {
            sendJson(
                response,
                400,
                {
                    error: 'Некорректный JSON'
                }
            );
        }

        return;
    }

    // ==========================================
    // DELETE /api/students/:id
    // ==========================================

    if (
        route?.handler === 'delete'
    ) {
        const index =
            students.findIndex(
                student =>
                    student.id === route.id
            );

        if (index === -1) {
            sendJson(
                response,
                404,
                {
                    error: 'Студент не найден'
                }
            );

            return;
        }

        students.splice(index, 1);

        sendJson(
            response,
            200,
            {
                deleted: true,
                id: route.id
            }
        );

        return;
    }

    // ==========================================
    // 405 Method Not Allowed
    // ==========================================

    if (
        pathname.startsWith('/api/students')
    ) {
        sendJson(
            response,
            405,
            {
                error: 'Method Not Allowed'
            }
        );

        return;
    }

    // ==========================================
    // 404 Not Found
    // ==========================================

    sendJson(
        response,
        404,
        {
            error: 'Route not found'
        }
    );
});

server.on('error', error => {
    console.error(
        `[SERVER ERROR] ${error.message}`
    );
});

server.listen(PORT, () => {
    console.log(
        `HTTP Router запущен на порту ${PORT}`
    );

    console.log(
        `Группа: ${GROUP}`
    );

    console.log(
        'REST API: /api/students'
    );
});