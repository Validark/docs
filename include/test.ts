const MapsFolder = game.GetService("ServerStorage").WaitForChild<Folder>("Maps");
const Status = game.GetService("ReplicatedStorage").WaitForChild<StringValue>("Status");
const Players = game.GetService("Players");
const Workspace = game.GetService("Workspace");
const ServerStorage = game.GetService("ServerStorage");

const Status2 = game.GetService("ReplicatedStorage").WaitForChild<Workspace>("Status");

function f2(o: Part) {
	(o as Part & ChangedSignal).Changed.Connect;
}

declare function classIs2<T extends Instance, Q extends T["ClassName"]>(
	instance: T,
	className: Q,
): instance is Instances[Q] extends T
	? (Instances[Q]["ClassName"] extends Q ? Instances[Q] : Instances[Q] & { ClassName: Q })
	: T;

type Check2<T extends Instance, Q extends T["ClassName"]> = Instances[Q] extends T
	? (Instances[Q]["ClassName"] extends Q ? Instances[Q] : Instances[Q] & { ClassName: Q })
	: 5;

type Test<T extends Instance> = T;
type Test2 = Test<IntValue>;
classIs2({} as ValueBase, "IntValue");

function f(o: ValueBase, z: Instance) {
	if (classIs(o, "BoolValue")) {
		o.Value;
	}

	if (classIs(z, "ScreenGui")) {
	}
}

function g(o: ValueBase) {
	o.Changed.Connect(v => print(v));
	o.Value;
	o.Value;
	if (classIs(o, "ObjectValue")) {
		o.Changed.Connect(v => print(v));
	}
}

const str = {} as StringValue;
type Ze = StringValue extends Instance ? true : false;

interface PlayerChildren {
	leaderstats: Folder & {
		Coins: IntValue;
	};
	Backpack: Backpack & {
		Sword: Model;
	};
}

interface CharacterChildren {
	Sword: Model;
}

const GameLength = 50;

const reward = 25;

// Game loop

while (true) {
	Status.Value = "Waiting for enough players";

	do {
		Players.PlayerAdded.Wait();
	} while (!(Players.GetPlayers().size() >= 2));

	Status.Value = "Intermission";

	wait(10);

	const plrs = Players.GetPlayers();
	const AvailableMaps = MapsFolder.GetChildren();
	const ChosenMap = AvailableMaps[math.random(0, AvailableMaps.size() - 1)];
	Status.Value = `${ChosenMap.Name} Chosen`;

	const ClonedMap = ChosenMap.Clone();
	ClonedMap.Parent = Workspace;

	// Teleport players to the map

	const SpawnPoints = ClonedMap.FindFirstChild<Model>("SpawnPoints")!;

	if (!SpawnPoints) {
		warn("SpawnPoints not found!");
	}

	let AvailableSpawnPoints = new Array<BasePart>();
	AvailableSpawnPoints = SpawnPoints.GetChildren();

	for (const [i, player] of plrs.entries()) {
		const character = player.Character;

		if (character) {
			// Teleport them
			if (character.FindFirstChild<Part>("HumanoidRootPart")) {
				player.Character!.FindFirstChild<Part>("HumanoidRootPart")!.CFrame = AvailableSpawnPoints.pop()!.CFrame;

				// Give them a sword

				const Sword = ServerStorage.FindFirstChild<Model>("Sword")!.Clone();
				Sword.Parent = player.WaitForChild("Backpack");

				const GameTag = new Instance("BoolValue");
				GameTag.Name = "GameTag";
				GameTag.Parent = player.Character;
			}
		}

		Status.Value = "Get ready to play!";

		wait(2);

		for (let i = GameLength; i > 0; i--) {
			const character = player.Character;

			if (character) {
				if (character.FindFirstChild("GameTag")) {
					// They are still alive
					print(`${player.Name} is still in the game!`);
				} else {
					// They are dead
					plrs.unorderedRemove(i);
					print(`${player.Name} has been removed!`);
				}
			}

			Status.Value = `There are ${i} seconds remaining, and ${plrs.size()} players left`;

			switch (plrs.size()) {
				case 1:
					// Last person standing
					Status.Value = "The winner is " + plrs[0].Name;

					// Another alternative is using unioned types:

					const plrs1 = plrs[0] as Player & PlayerChildren;
					plrs1.leaderstats.Coins.Value = plrs1.leaderstats.Coins.Value + reward;
					break;
				case 0:
					Status.Value = "Nobody won!";
					break;
				default:
					break;
			}

			if (i === 0) {
				Status.Value = "Time up!";
				break;
			}

			wait(1);
		}
		print("End of game");

		for (const player of Players.GetPlayers()) {
			const character = player.Character;

			if (!character) {
				// Ignore them
			} else {
				const GameTag = character.FindFirstChild("GameTag");
				if (GameTag) {
					GameTag.Destroy();
				}

				const playerChildren = player as Player & PlayerChildren;
				const characterChildren = character as Model & CharacterChildren;

				if (playerChildren.Backpack.Sword) {
					playerChildren.Backpack.Sword.Destroy();
				} else if (characterChildren.Sword) {
					characterChildren.Sword.Destroy();
				}
			}
		}

		ClonedMap.Destroy();

		Status.Value = "Game ended";

		wait(2);
	}
}
