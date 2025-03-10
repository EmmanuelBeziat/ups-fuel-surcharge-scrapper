<?php

class Hittheroad_UPS_Cron {
	public function __construct () {
		$this->init();
		$this->database();
	}

	private function init () {
		$this->url = 'https://ups.emmanuelbeziat.com';
	}

	private function database () {
		try {
			$this->pdo = new PDO('mysql:host=localhost;dbname=u173847895_htr_shop;charset=utf8', 'u173847895_hittheroad', 'XZTJ87r[~Jm3;[s6P6~G');
		}
		catch (Exception $e) {
			die('Erreur : ' . $e->getMessage());
		}
	}

	private function callAPI($method, $url, $data) {
		$curl = curl_init();

		switch ($method) {
			case 'POST':
				curl_setopt($curl, CURLOPT_POST, 1);
				if ($data)
					curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
				break;
			case 'PUT':
				curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PUT');
				if ($data)
					curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
				break;
			default:
				if ($data)
					$url = sprintf("%s?%s", $url, http_build_query($data));
		}

		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_HTTPHEADER, [
			'Content-Type: application/json',
		]);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

		$result = curl_exec($curl);
		if(!$result) { die('Connection Failure'); }
		curl_close($curl);
		return $result;
	}

	public function updateValue ($value, $name) {
		$data = [
			'option_value' => $value,
			'option_name' => $name,
		];

		$sql = "UPDATE htrwp_options SET option_value=:option_value WHERE option_name=:option_name";
		$stmt = $this->pdo->prepare($sql)->execute($data);
	}

	public function getApi () {
		$api = $this->callAPI('GET', $this->url, false);
		return json_decode($api, true);
	}

	public function parseValue ($value) {
		return floatval(str_replace(',', '.', $value));
	}

	public function sendAlert () {
		$to = 'contact@emmanuelbeziat.com';
		$subject = 'HitTheRoad // UPS Alert';
		$message = 'La récupération de la taxe fuel sur le site UPS a échoué';
		$headers = [
			'From' => 'contact@emmanuelbeziat.com',
			'Reply-To' => 'contact@emmanuelbeziat.com',
			'X-Mailer' => 'PHP/' . phpversion()
		];

		mail($to, $subject, $message, $headers);
	}
}

$ups = new Hittheroad_UPS_Cron();
$result = $ups->getApi();
if ($result === 'Connection Failure' || !isset($result) || !isset($result[0]['standard']) || !isset($result[0]['express'])) {
	$ups->sendAlert();
	die();
}

// $date = $result[0]['date'];
$standard = $ups->parseValue($result[0]['standard']);
$express = $ups->parseValue($result[0]['express']);

$ups->updateValue($standard, 'options_shipping-taxes_shipping-tax-std');
$ups->updateValue($express, 'options_shipping-taxes_shipping-tax-express');
?>
