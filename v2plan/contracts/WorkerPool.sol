pragma solidity ^0.4.18;

import './OwnableOZ.sol';
import './IexecHubAccessor.sol';
import './IexecHub.sol';
import "./SafeMathOZ.sol";
import "./AuthorizedList.sol";
import "./Contributions.sol";

contract WorkerPool is OwnableOZ, IexecHubAccessor//Owned by a S(w)
{
	using SafeMathOZ for uint256;

	enum WorkerPoolStatusEnum { OPEN, CLOSE }




	/**
	 * Members
	 */
	string                                       public m_name;
	uint256                                      public m_schedulerStakePolicyRatio;
	uint256                                      public m_workerStakePolicyRatio;
	WorkerPoolStatusEnum                         public m_workerPoolStatus;
	address[]                                    public m_workers;
	// mapping(address=> index)
	mapping(address => uint256)                  public m_workerIndex;
	// mapping(taskID => TaskContributions address);
	//mapping(address => address)                     public m_tasks;



	/**
	 * Address of slave contracts
	 */
	address public m_workersAuthorizedListAddress;


	/**
	 * Methods
	 */

	//constructor
	function WorkerPool(
		address _iexecHubAddress,
		string  _name)
	IexecHubAccessor(_iexecHubAddress)
	public
	{
		// tx.origin == owner
		// msg.sender ==  WorkerPoolHub
		require(tx.origin != msg.sender );
		transferOwnership(tx.origin); // owner → tx.origin

		m_name             = _name;
		m_schedulerStakePolicyRatio = 30; // % of the task price to stake → cf function SubmitTask
		m_workerStakePolicyRatio = 30;
		m_workerPoolStatus = WorkerPoolStatusEnum.OPEN;


		/* cannot do the following AuthorizedList contracts creation because of :
		   VM Exception while processing transaction: out of gas at deploy.
		   use attach....AuthorizedListContract instead function
		*/
   /*
	  workersAuthorizedListAddress = new AuthorizedList();
	  AuthorizedList(workersAuthorizedListAddress).transferOwnership(tx.origin); // owner → tx.origin
		dappsAuthorizedListAddress = new AuthorizedList();
		AuthorizedList(dappsAuthorizedListAddress).transferOwnership(tx.origin); // owner → tx.origin
		requesterAuthorizedListAddress = new AuthorizedList();
		AuthorizedList(requesterAuthorizedListAddress).transferOwnership(tx.origin); // owner → tx.origin
		*/
	}


	function attachWorkerPoolsAuthorizedListContract(address _workerPoolsAuthorizedListAddress) public onlyOwner{
 		m_workersAuthorizedListAddress =_workerPoolsAuthorizedListAddress;
 	}

	function changeStakePolicyRatio(uint256 _newWorkerStakePolicyRatio,uint256 _newSchedulerStakePolicyRatio) public onlyOwner
	{
		m_schedulerStakePolicyRatio = _newSchedulerStakePolicyRatio;
		m_workerStakePolicyRatio = _newWorkerStakePolicyRatio;
		//TODO LOG
	}

	function getWorkerPoolOwner() public view returns (address)
	{
		return m_owner;
	}

	/************************* worker list management **************************/
	function isWorkerAllowed(address _worker) public view returns (bool)
	{
		return AuthorizedList(m_workersAuthorizedListAddress).isActorAllowed(_worker);
	}

	function getWorkerAddress(uint _index) constant public returns (address)
	{
		return m_workers[_index];
	}
	function getWorkerIndex(address _worker) constant public returns (uint)
	{
		uint index = m_workerIndex[_worker];
		require(m_workers[index] == _worker);
		return index;
	}
	function getWorkersCount() constant public returns (uint)
	{
		return m_workers.length;
	}
	function addWorker(address _worker) public onlyOwner returns (bool)
	{
		uint index = m_workers.push(_worker);
		m_workerIndex[_worker] = index;

		//LOG TODO
		return true;
	}
	function removeWorker(address _worker) public onlyOwner returns (bool)
	{
		uint index = getWorkerIndex(_worker); // fails if worker not registered
		m_workers[index] = m_workers[m_workers.length-1];
		delete m_workers[m_workers.length-1];
		m_workers.length--;

		//LOG TODO
		return true;
	}

	/************************* open / close mechanisms *************************/
	function open() public onlyIexecHub /*for staking management*/ returns (bool)
	{
		require(m_workerPoolStatus == WorkerPoolStatusEnum.CLOSE);
		m_workerPoolStatus = WorkerPoolStatusEnum.OPEN;
		return true;
	}
	function close() public onlyIexecHub /*for staking management*/ returns (bool)
	{
		require(m_workerPoolStatus == WorkerPoolStatusEnum.OPEN);
		m_workerPoolStatus = WorkerPoolStatusEnum.CLOSE;
		return true;
	}
	function isOpen() public view returns (bool)
	{
		return m_workerPoolStatus == WorkerPoolStatusEnum.OPEN;
	}

	/**************************** tasks management *****************************/
	function acceptTask(address _taskID, uint256 _taskCost) public onlyIexecHub returns (address taskContributions)
	{
		address newContributions = new Contributions(iexecHubAddress,_taskID,_taskCost,_taskCost.mul(m_schedulerStakePolicyRatio).div(100),_taskCost.mul(m_workerStakePolicyRatio).div(100));
		return newContributions;
	}







}
