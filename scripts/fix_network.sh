cat << 'EOF' > /tmp/fix_network.php
<?php
use App\Models\Service;
use App\Actions\Service\StartService;

$service = Service::where('uuid', 'nwv7rapussqqyjzgigjb36ok')->firstOrFail();
$service->connect_to_docker_network = false;
$service->save();

echo "Updated connect_to_docker_network to false.\n";
echo "Redeploying service with stopBeforeStart: true...\n";

$activity = StartService::run($service, pullLatestImages: false, stopBeforeStart: true);
echo "Activity ID: " . $activity->id . "\n";
EOF

docker cp /tmp/fix_network.php coolify:/var/www/html/fix_network.php
docker exec coolify php -r "require '/var/www/html/vendor/autoload.php'; \$app = require_once '/var/www/html/bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require '/var/www/html/fix_network.php';"
