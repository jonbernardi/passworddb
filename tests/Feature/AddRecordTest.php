<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_adding_new_record()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $data = [
            [
                'name' => 'field',
                'value' => 'value',
                'type' => 'text',
            ],
            [
                'name' => 'field2',
                'value' => 'value',
                'type' => 'textarea',
            ],
            [
                'name' => 'field3',
                'value' => true,
                'type' => 'boolean',
            ],
        ];
        $response = $this->post("/{$site->id}/section/{$section->id}/data", [
            'name' => 'new record',
            'records' => $data,
        ]);
        $this->assertDatabaseCount('data', 1);
        $record = $section->data()->firstOrFail();
        $this->assertSame($data, $record->data);
    }

    public function test_heading_is_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $response = $this->post("/{$site->id}/section/{$section->id}/data", [
            'name' => '',
            'records' => [
                [
                    'name' => 'field',
                    'value' => 'value',
                    'type' => 'text',
                ],
            ],
        ]);
        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseCount('data', 0);
    }

    public function test_field_name_is_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $response = $this->post("/{$site->id}/section/{$section->id}/data", [
            'name' => 'new record',
            'records' => [
                [
                    'name' => '',
                    'value' => 'value',
                    'type' => 'text',
                ],
            ],
        ]);
        $response->assertSessionHasErrors(['records.0.name']);
        $this->assertDatabaseCount('data', 0);
    }

    public function test_at_least_one_field_required()
    {
        $site = Site::factory()->create();
        $section = Section::factory()->create(['site_id' => $site->id]);
        $response = $this->post("/{$site->id}/section/{$section->id}/data", [
            'name' => 'new record',
            'records' => [],
        ]);
        $response->assertSessionHasErrors(['records']);
        $this->assertDatabaseCount('data', 0);
    }
}
