set -e

echo "1. Extraindo código da versão 35e1f4b..."
rm -rf /tmp/build_atendeja
mkdir -p /tmp/build_atendeja
tar -xzf /tmp/atendeja_release.tar.gz -C /tmp/build_atendeja

echo "2. Construindo imagem Docker whcneilxqvpywghisxszf4fr:35e1f4b..."
docker build -t whcneilxqvpywghisxszf4fr:35e1f4b /tmp/build_atendeja

echo "3. Atualizando docker-compose.yaml do Coolify..."
sed -i "s|image: 'whcneilxqvpywghisxszf4fr:.*'|image: 'whcneilxqvpywghisxszf4fr:35e1f4b'|g" /data/coolify/applications/whcneilxqvpywghisxszf4fr/docker-compose.yaml

echo "4. Recarregando container em produção..."
cd /data/coolify/applications/whcneilxqvpywghisxszf4fr
docker compose up -d

echo "5. Verificando container ativo..."
docker ps --filter "name=whcneilxqvpywghisxszf4fr"

echo "6. Testando resposta HTTP da Landing Page em produção..."
curl -s -o /tmp/landing_prod.html https://atendeja.minhaempresaautonoma.online/
grep -i "Falar no WhatsApp" /tmp/landing_prod.html || echo "AVISO: Não encontrou o botão na resposta"
