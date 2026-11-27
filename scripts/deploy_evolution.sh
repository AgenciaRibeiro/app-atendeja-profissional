cat << 'EOF' > /tmp/create_evolution.php
<?php
use App\Models\Environment;
use App\Models\Service;
use App\Actions\Service\StartService;

$env = Environment::where('uuid', 'saexkhtnpz9q98ze6paqskxu')->firstOrFail();
$server = $env->project->team->servers->first();
$destination = $server->standaloneDockers->first();

// Check if Evolution-API already exists
$existing = Service::where('environment_id', $env->id)->where('service_type', 'evolution-api')->first();
if ($existing) {
    echo "Found existing Evolution-API service: " . $existing->uuid . "\n";
    $service = $existing;
} else {
    $services = get_service_templates();
    $key = resolve_service_template_key('evolution-api', $services);
    $composeRaw = base64_decode(data_get($services, "$key.compose"));

    $service_payload = [
        'docker_compose_raw' => $composeRaw,
        'environment_id' => $env->id,
        'service_type' => $key,
        'server_id' => $destination->server_id,
        'destination_id' => $destination->id,
        'destination_type' => $destination->getMorphClass(),
        'connect_to_docker_network' => true,
    ];

    $service = new Service($service_payload);
    $service->save();
    $service->name = "Evolution-API-" . $service->uuid;
    $service->save();

    $service->parse(isNew: true);
    applyServiceApplicationPrerequisites($service);
    echo "Created new Service: " . $service->uuid . "\n";
}

// Configure FQDN on api service application
$api = $service->applications()->where('name', 'api')->first();
if ($api) {
    $api->fqdn = 'https://evo.minhaempresaautonoma.online';
    $api->save();
    echo "Configured API FQDN: https://evo.minhaempresaautonoma.online\n";
}

// Generate or get API KEY
$apiKeyVar = $service->environment_variables()->where('key', 'SERVICE_PASSWORD_AUTHENTICATIONAPIKEY')->first();
if (!$apiKeyVar || empty($apiKeyVar->value)) {
    $apiKey = bin2hex(random_bytes(16));
} else {
    $apiKey = $apiKeyVar->value;
}

$envsToSet = [
    'SERVER_URL' => 'https://evo.minhaempresaautonoma.online',
    'SERVICE_PASSWORD_AUTHENTICATIONAPIKEY' => $apiKey,
    'AUTHENTICATION_API_KEY' => $apiKey,
    'N8N_ENABLED' => 'true',
    'LANGUAGE' => 'pt-BR',
    'DEL_INSTANCE' => 'false',
    'DATABASE_SAVE_DATA_INSTANCE' => 'true',
    'DATABASE_SAVE_DATA_NEW_MESSAGE' => 'true',
    'DATABASE_SAVE_MESSAGE_UPDATE' => 'true',
    'DATABASE_SAVE_DATA_CONTACTS' => 'true',
    'DATABASE_SAVE_DATA_CHATS' => 'true',
    'DATABASE_SAVE_DATA_LABELS' => 'true',
    'DATABASE_SAVE_DATA_HISTORIC' => 'true',
    'CONFIG_SESSION_PHONE_CLIENT' => 'AtendeJa Profissional',
    'CONFIG_SESSION_PHONE_NAME' => 'Chrome',
    'QRCODE_LIMIT' => '30',
    'CACHE_REDIS_ENABLED' => 'true',
];

foreach ($envsToSet as $k => $v) {
    $service->environment_variables()->updateOrCreate(
        ['key' => $k],
        [
            'value' => $v,
            'resourceable_id' => $service->id,
            'resourceable_type' => $service->getMorphClass(),
            'is_preview' => false,
        ]
    );
}

$service->parse(isNew: false);

echo "--- EVOLUTION API CONFIGURATION ---\n";
echo "Service UUID: " . $service->uuid . "\n";
echo "Dashboard / API URL: https://evo.minhaempresaautonoma.online\n";
echo "Global API Key: " . $apiKey . "\n";
echo "Deploying via StartService...\n";

$activity = StartService::run($service, pullLatestImages: true);
echo "Deployment started! Activity ID: " . $activity->id . "\n";
EOF

docker cp /tmp/create_evolution.php coolify:/var/www/html/create_evolution.php
docker exec coolify php -r "require '/var/www/html/vendor/autoload.php'; \$app = require_once '/var/www/html/bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require '/var/www/html/create_evolution.php';"
