cat << 'EOF' > /tmp/test_evo_template.php
<?php
use App\Models\Environment;
use App\Models\Service;

$env = Environment::where('uuid', 'saexkhtnpz9q98ze6paqskxu')->firstOrFail();
$server = $env->project->team->servers->first();
$destination = $server->standaloneDockers->first();

echo "Environment: " . $env->name . " (ID: " . $env->id . ")\n";
echo "Server: " . $server->name . " (ID: " . $server->id . ")\n";
echo "Destination: " . $destination->name . " (ID: " . $destination->id . ")\n";

$services = get_service_templates();
$key = resolve_service_template_key('evolution-api', $services);
$compose = data_get($services, "$key.compose");

if (!$compose) {
    echo "ERROR: Template evolution-api not found!\n";
    exit(1);
}

echo "Template found: " . $key . "\n";
EOF

docker cp /tmp/test_evo_template.php coolify:/var/www/html/test_evo_template.php
docker exec coolify php -r "require '/var/www/html/vendor/autoload.php'; \$app = require_once '/var/www/html/bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require '/var/www/html/test_evo_template.php';"
