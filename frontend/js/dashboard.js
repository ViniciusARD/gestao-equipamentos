// js/dashboard.js

// Função executada assim que a página é carregada
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('accessToken');

    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    if (!token) {
        // Se não houver token, redireciona para a página de login
        window.location.href = 'login.html';
        return;
    }

    // 2. BUSCAR E EXIBIR EQUIPAMENTOS
    fetchEquipmentTypes(token);

    // 3. CONFIGURAR O BOTÃO DE LOGOUT
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('accessToken'); // Remove o token
        window.location.href = 'login.html'; // Redireciona para o login
    });
});

async function fetchEquipmentTypes(token) {
    const equipmentListDiv = document.getElementById('equipmentList');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/equipments/types', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Envia o token para a API
            }
        });

        if (response.status === 401) {
            // Se o token for inválido/expirado, redireciona para o login
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Falha ao buscar os equipamentos.');
        }

        const equipmentTypes = await response.json();

        if (equipmentTypes.length === 0) {
            equipmentListDiv.innerHTML = '<p class="text-muted">Nenhum tipo de equipamento cadastrado no momento.</p>';
            return;
        }

        // Limpa a lista antes de adicionar os novos itens
        equipmentListDiv.innerHTML = ''; 

        // Cria um card para cada tipo de equipamento
        equipmentTypes.forEach(type => {
            const card = `
                <div class="col-md-4">
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${type.name}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${type.category}</h6>
                            <p class="card-text">${type.description || 'Sem descrição.'}</p>
                            <a href="#" class="btn btn-sm btn-outline-primary">Ver Unidades</a>
                        </div>
                    </div>
                </div>
            `;
            equipmentListDiv.innerHTML += card;
        });

    } catch (error) {
        equipmentListDiv.innerHTML = '<p class="text-danger">Erro ao carregar os equipamentos. Tente novamente mais tarde.</p>';
        console.error('Erro:', error);
    }
}