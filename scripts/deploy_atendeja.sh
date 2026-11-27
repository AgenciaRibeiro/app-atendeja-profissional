cat << 'EOF' > /tmp/deploy_app.php
<?php
use App\Models\Application;
use Illuminate\Support\Str;

$app = Application::where('id', 5)->firstOrFail();
$deploymentUuid = (string) Str::uuid();

echo "Queuing deployment for: " . $app->name . " (UUID: " . $app->uuid . ")\n";
$result = queue_application_deployment(
    application: $app,
    deployment_uuid: $deploymentUuid,
    force_rebuild: true
);

print_r($result);
EOF

docker cp /tmp/deploy_app.php coolify:/var/www/html/deploy_app.php
docker exec coolify php -r "require '/var/www/html/vendor/autoload.php'; \$app = require_once '/var/www/html/bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require '/var/www/html/deploy_app.php';"
